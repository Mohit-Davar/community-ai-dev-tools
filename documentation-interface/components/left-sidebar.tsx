"use client";

import React from "react";
import Link from "next/link";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { products } from "@/lib/mock-data";
import { IconSettings, IconHome } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface LeftSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LeftSidebar({ isOpen, onClose }: LeftSidebarProps) {
  const setOpen = React.useCallback(
    (value: React.SetStateAction<boolean>) => {
      const nextValue = typeof value === "function" ? value(isOpen) : value;
      if (!nextValue) {
        onClose();
      }
    },
    [isOpen, onClose],
  );

  return (
    <Sidebar open={isOpen} setOpen={setOpen} animate={false}>
      <SidebarBody className="border-border justify-between gap-8 border-r bg-sidebar text-sidebar-foreground">
        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="space-y-6">
            {/* Quick Links */}
            <div className="space-y-1">
              <Link
                href="/"
                className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <IconHome className="size-4 shrink-0" />
                <span>Overview</span>
              </Link>
            </div>

            {/* Products Section */}
            <div className="space-y-2">
              <h3 className="text-muted-foreground px-2 text-xs font-semibold tracking-wider uppercase">
                Products
              </h3>
              <div className="space-y-1">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <div
                      className={cn(
                        "h-2.5 w-2.5 shrink-0 rounded-full shadow-xs",
                        product.color,
                      )}
                    />
                    <span className="truncate">{product.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom / Settings */}
        <div className="border-border border-t pt-4">
          <SidebarLink
            link={{
              label: "Settings",
              href: "/settings",
              icon: (
                <IconSettings className="size-5 shrink-0 text-muted-foreground" />
              ),
            }}
          />
        </div>
      </SidebarBody>
    </Sidebar>
  );
}
