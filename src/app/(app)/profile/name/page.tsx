import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { NameForm } from "./NameForm";

/**
 * `/profile/name` (F4): the display-name form's own sub-route, linked
 * from `/profile`'s "Sửa tên hiển thị ›" settings row. Session check
 * mirrors `/profile` and `/sign-up/profile`.
 */
export default async function NameSubPage() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/sign-in");
    return null;
  }

  return <NameForm name={session.user.name} />;
}
