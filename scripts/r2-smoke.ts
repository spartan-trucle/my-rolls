import { loadEnvConfig } from "@next/env";
import { randomBytes, randomUUID } from "node:crypto";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getR2Env, createPresignedDownloadUrl, createPresignedUploadUrl } from "../src/lib/r2";

loadEnvConfig(process.cwd(), true);

let failed = false;
const createdObjects: Array<{ bucket: string; key: string }> = [];
let uploadedBody: Buffer | null = null;
let uploadedKey: string | null = null;

async function cleanup() {
  if (createdObjects.length === 0) return;

  const env = getR2Env();
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });

  for (const { bucket, key } of createdObjects) {
    try {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    } catch (err) {
      process.stderr.write(`Failed to delete ${key}: ${err}\n`);
    }
  }

  await client.destroy();
}

async function step1Safety() {
  try {
    const env = getR2Env();
    const isProd = process.argv.includes("--prod");

    if (!isProd && (!env.R2_BUCKET_ORIGINALS.includes("-dev-") || !env.R2_BUCKET_PUBLIC.includes("-dev-"))) {
      console.log("✗ Safety: bucket names lack '-dev-' and --prod wasn't passed");
      failed = true;
      return;
    }

    console.log("✓ Safety");
  } catch (err) {
    console.log(`✗ Safety: ${err instanceof Error ? err.message : String(err)}`);
    failed = true;
  }
}

async function step2PrivateUpload() {
  try {
    const { url, key } = await createPresignedUploadUrl({
      userId: "smoke",
      contentType: "image/png",
      size: 1024,
    });

    uploadedBody = randomBytes(1024);
    uploadedKey = key;
    createdObjects.push({ bucket: getR2Env().R2_BUCKET_ORIGINALS, key });

    const response = await fetch(url, {
      method: "PUT",
      body: new Uint8Array(uploadedBody),
      headers: {
        "Content-Type": "image/png",
        "Content-Length": "1024",
      },
    });

    if (response.status !== 200) {
      console.log(`✗ Private upload: expected 200, got ${response.status}`);
      failed = true;
      return;
    }

    console.log("✓ Private upload");
  } catch (err) {
    console.log(`✗ Private upload: ${err instanceof Error ? err.message : String(err)}`);
    failed = true;
  }
}

async function step3SizeEnforcement() {
  try {
    const { url } = await createPresignedUploadUrl({
      userId: "smoke",
      contentType: "image/png",
      size: 1024,
    });

    const oversizedBody = randomBytes(1025);

    const response = await fetch(url, {
      method: "PUT",
      body: new Uint8Array(oversizedBody),
      headers: {
        "Content-Type": "image/png",
        "Content-Length": "1025",
      },
    });

    if (response.status < 300) {
      console.log(`✗ Size enforcement: R2 accepted oversized upload (status ${response.status})`);
      failed = true;
      return;
    }

    console.log("✓ Size enforcement");
  } catch (err) {
    console.log(`✗ Size enforcement: ${err instanceof Error ? err.message : String(err)}`);
    failed = true;
  }
}

async function step4PrivateGet() {
  try {
    if (!uploadedKey) {
      console.log("✗ Private GET: no key from upload step");
      failed = true;
      return;
    }

    const url = await createPresignedDownloadUrl({ key: uploadedKey });
    const response = await fetch(url);

    if (response.status !== 200) {
      console.log(`✗ Private GET: expected 200, got ${response.status}`);
      failed = true;
      return;
    }

    const downloadedBody = await response.arrayBuffer();
    if (!uploadedBody || !Buffer.from(downloadedBody).equals(uploadedBody)) {
      console.log("✗ Private GET: downloaded bytes don't match uploaded");
      failed = true;
      return;
    }

    console.log("✓ Private GET");
  } catch (err) {
    console.log(`✗ Private GET: ${err instanceof Error ? err.message : String(err)}`);
    failed = true;
  }
}

async function step5UnsignedPrivate() {
  try {
    const env = getR2Env();

    if (!uploadedKey) {
      console.log("✗ Unsigned private GET: no key from upload step");
      failed = true;
      return;
    }

    const url = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET_ORIGINALS}/${uploadedKey}`;
    const response = await fetch(url);

    if (response.status < 300) {
      console.log(`✗ Unsigned private GET: expected non-2xx, got ${response.status}`);
      failed = true;
      return;
    }

    console.log("✓ Unsigned private GET");
  } catch (err) {
    console.log(`✗ Unsigned private GET: ${err instanceof Error ? err.message : String(err)}`);
    failed = true;
  }
}

async function step6Public() {
  try {
    const env = getR2Env();

    if (env.R2_PUBLIC_URL.endsWith(".r2.cloudflarestorage.com")) {
      console.log(
        "✗ Public: R2_PUBLIC_URL is the S3 API endpoint; use the bucket's https://pub-….r2.dev URL",
      );
      failed = true;
      return;
    }

    const client = new S3Client({
      region: "auto",
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });

    const key = `smoke/${randomUUID()}.txt`;
    const body = "public test";

    await client.send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET_PUBLIC,
        Key: key,
        Body: body,
      }),
    );

    createdObjects.push({ bucket: env.R2_BUCKET_PUBLIC, key });

    const response = await fetch(`${env.R2_PUBLIC_URL}/${key}`);

    if (response.status !== 200) {
      console.log(`✗ Public: expected 200, got ${response.status}`);
      await client.destroy();
      failed = true;
      return;
    }

    const content = await response.text();
    if (content !== body) {
      console.log("✗ Public: response body doesn't match");
      await client.destroy();
      failed = true;
      return;
    }

    await client.destroy();
    console.log("✓ Public");
  } catch (err) {
    console.log(`✗ Public: ${err instanceof Error ? err.message : String(err)}`);
    failed = true;
  }
}

async function step7Cleanup() {
  try {
    await cleanup();
    console.log("✓ Cleanup");
  } catch (err) {
    console.log(`✗ Cleanup: ${err instanceof Error ? err.message : String(err)}`);
    failed = true;
  }
}

async function main() {
  try {
    await step1Safety();
    if (failed) {
      process.exit(1);
    }

    await step2PrivateUpload();
    if (failed) {
      await cleanup();
      process.exit(1);
    }

    await step3SizeEnforcement();
    if (failed) {
      await cleanup();
      process.exit(1);
    }

    await step4PrivateGet();
    if (failed) {
      await cleanup();
      process.exit(1);
    }

    await step5UnsignedPrivate();
    if (failed) {
      await cleanup();
      process.exit(1);
    }

    await step6Public();
    if (failed) {
      await cleanup();
      process.exit(1);
    }

    await step7Cleanup();
    if (failed) {
      process.exit(1);
    }

    console.log("\n✓ All tests passed");
  } catch (err) {
    console.error(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
    await cleanup();
    process.exit(1);
  }
}

main();
