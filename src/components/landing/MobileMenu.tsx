"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { Button } from "@/design-system";
import styles from "./Header.module.css";

export interface MenuLink {
  href: string;
  label: string;
}

interface MobileMenuProps {
  /** Accessible name of the toggle and the menu ("Trình đơn"). */
  label: string;
  links: MenuLink[];
}

/** The phone header's menu button and the links it shows. Closes on a link or Escape. */
export function MobileMenu({ label, links }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <Button
        variant="quiet"
        icon="menu"
        aria-label={label}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((isOpen) => !isOpen)}
      />
      <nav id={menuId} className={styles.menu} aria-label={label} hidden={!open}>
        <ul className={styles.menuList}>
          {links.map((link) => (
            <li key={link.href}>
              <Link className={styles.menuLink} href={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
