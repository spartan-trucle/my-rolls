export const ICON_PATHS = {
  roll: ["M6 7h9a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z", "M8.5 7V4h4v3", "M5 11.5h11M5 16.5h11", "M16 11h3.5a1.5 1.5 0 0 1 1.5 1.5v2a1.5 1.5 0 0 1-1.5 1.5H16"],
  film: ["M3 5h18v14H3z", "M7.5 9h9v6h-9z", "M6 7h.01M9.5 7h.01M13 7h.01M16.5 7h.01M6 17h.01M9.5 17h.01M13 17h.01M16.5 17h.01"],
  camera: ["M5 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z", "M8 7l1.5-3h5L16 7", "M12 10a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z", "M17.5 10h.01"],
  print: ["M4 3h16v18H4z", "M7 6h10v9H7z", "M7 13.5l3-3 2.5 2.5 1.5-1.5 3 3", "M14.5 8.5h.01"],
  keeper: ["M11 3c.9 4.9 2.6 6.6 7.5 7.5-4.9.9-6.6 2.6-7.5 7.5-.9-4.9-2.6-6.6-7.5-7.5C8.4 9.6 10.1 7.9 11 3z", "M19 17v4M17 19h4"],
  oops: ["M6 4l1.5 10M12 3v11M18 4l-1.5 10", "M7.8 19h.01M12 19.5h.01M16.2 19h.01"],
  friends: ["M9 4a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z", "M2.5 20c.4-3.6 3-6 6.5-6s6.1 2.4 6.5 6", "M15.5 4.3a3.5 3.5 0 0 1 0 6.4", "M18 14.5c2 .9 3.2 2.8 3.5 5.5"],
  share: ["M12 3v12", "M7.5 7.5L12 3l4.5 4.5", "M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"],
  upload: ["M12 16V4", "M7.5 8.5L12 4l4.5 4.5", "M4 20h16"],
  note: ["M4 20l1-4L16 5l3 3L8 19z", "M14 7l3 3", "M13 20h7"],
  menu: ["M4 7h16", "M4 12h16", "M4 17h10"],
} as const satisfies Record<string, readonly string[]>;

export type IconName = keyof typeof ICON_PATHS;

export const ICON_NAMES = Object.keys(ICON_PATHS) as IconName[];
