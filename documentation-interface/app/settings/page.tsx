"use client";

import { MainLayout } from "@/components/main-layout";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Check, Moon, Sun, Monitor } from "lucide-react";
import { useState } from "react";

const themes = [
  { id: "light", name: "Light", icon: Sun },
  { id: "dark", name: "Dark", icon: Moon },
  { id: "system", name: "System", icon: Monitor },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [savedSettings, setSavedSettings] = useState(false);

  const handleSave = () => {
    setSavedSettings(true);
    setTimeout(() => setSavedSettings(false), 2000);
  };

  return (
    <MainLayout showRightSidebar={false}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="border-border bg-background/50 sticky top-16 z-30 border-b">
          <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-foreground mb-2 text-4xl font-bold">
                Settings
              </h1>
              <p className="text-foreground/70">
                Customize your documentation portal experience
              </p>
            </motion.div>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="mx-auto max-w-4xl px-4 py-12 md:px-8">
          {/* Appearance Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-12"
          >
            <h2 className="text-foreground mb-6 text-2xl font-bold">
              Appearance
            </h2>

            <div className="bg-card border-border rounded-lg border p-6">
              <h3 className="text-foreground mb-4 font-semibold">Theme</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {themes.map((themeOption) => {
                  const Icon = themeOption.icon;
                  const isSelected = theme === themeOption.id;

                  return (
                    <motion.button
                      key={themeOption.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setTheme(themeOption.id)}
                      className={`flex items-center gap-3 rounded-lg border-2 p-4 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <div className="text-left">
                        <div className="text-foreground font-semibold">
                          {themeOption.name}
                        </div>
                        <div className="text-foreground/60 text-xs">
                          {themeOption.id === "system" &&
                            "Use system preference"}
                          {themeOption.id === "light" && "Light mode"}
                          {themeOption.id === "dark" && "Dark mode"}
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="text-primary ml-auto h-5 w-5" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.section>

          {/* Documentation Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="mb-12"
          >
            <h2 className="text-foreground mb-6 text-2xl font-bold">
              Documentation
            </h2>

            <div className="space-y-4">
              <div className="bg-card border-border rounded-lg border p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-foreground font-semibold">
                    Table of Contents
                  </h3>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 rounded"
                    />
                    <span className="text-foreground/70 text-sm">
                      Show on all pages
                    </span>
                  </label>
                </div>
                <p className="text-foreground/60 text-sm">
                  Display the table of contents sidebar on documentation pages
                </p>
              </div>

              <div className="bg-card border-border rounded-lg border p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-foreground font-semibold">
                    Code Highlighting
                  </h3>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 rounded"
                    />
                    <span className="text-foreground/70 text-sm">Enable</span>
                  </label>
                </div>
                <p className="text-foreground/60 text-sm">
                  Enable syntax highlighting for code examples
                </p>
              </div>

              <div className="bg-card border-border rounded-lg border p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-foreground font-semibold">Font Size</h3>
                  <select className="border-border bg-background text-foreground rounded border px-3 py-1 text-sm">
                    <option>Normal</option>
                    <option>Large</option>
                    <option>Extra Large</option>
                  </select>
                </div>
                <p className="text-foreground/60 text-sm">
                  Adjust the documentation font size
                </p>
              </div>
            </div>
          </motion.section>

          {/* Preferences Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-12"
          >
            <h2 className="text-foreground mb-6 text-2xl font-bold">
              Preferences
            </h2>

            <div className="space-y-4">
              <div className="bg-card border-border rounded-lg border p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-foreground font-semibold">
                    Email Notifications
                  </h3>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="h-4 w-4 rounded" />
                    <span className="text-foreground/70 text-sm">Enable</span>
                  </label>
                </div>
                <p className="text-foreground/60 text-sm">
                  Receive notifications about new documentation and updates
                </p>
              </div>

              <div className="bg-card border-border rounded-lg border p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-foreground font-semibold">Show Tips</h3>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 rounded"
                    />
                    <span className="text-foreground/70 text-sm">Enable</span>
                  </label>
                </div>
                <p className="text-foreground/60 text-sm">
                  Display helpful tips and suggestions while browsing
                </p>
              </div>

              <div className="bg-card border-border rounded-lg border p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-foreground font-semibold">Language</h3>
                  <select className="border-border bg-background text-foreground rounded border px-3 py-1 text-sm">
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>Swahili</option>
                  </select>
                </div>
                <p className="text-foreground/60 text-sm">
                  Choose your preferred language
                </p>
              </div>
            </div>
          </motion.section>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="flex items-center gap-4"
          >
            <Button onClick={handleSave} size="lg">
              Save Settings
            </Button>
            {savedSettings && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm text-green-600 dark:text-green-400"
              >
                ✓ Settings saved
              </motion.span>
            )}
          </motion.div>
        </div>
      </motion.div>
    </MainLayout>
  );
}
