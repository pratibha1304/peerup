"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Visibility = "community" | "matches-only";

const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

const DEFAULT_SETTINGS = {
  emailUpdates: true,
  matchAlerts: true,
  callReminders: true,
  digestFrequency: "weekly",
  profileVisibility: "community" as Visibility,
  timezone: defaultTimezone,
};

type SettingsState = typeof DEFAULT_SETTINGS;

export default function SettingsPage() {
  const { user, loading, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const digestOptions: SettingsState['digestFrequency'][] = ['daily', 'weekly', 'off'];

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.name || "");
    const merged = { ...DEFAULT_SETTINGS, ...(user.settings || {}) };
    setSettings(merged);
  }, [user]);

  const handleToggle = <K extends keyof SettingsState>(key: K) => (value: SettingsState[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const updates = {
        name: displayName.trim() || user.name,
        settings,
      };

      await updateProfile(updates);
      setMessage("Settings updated");
    } catch (err: any) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    alert("We're happy you're here! If you really need to delete your account, reach out to support and we'll take care of it.");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Loading your settings...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-center">
        <div>
          <h2 className="text-2xl font-semibold mb-2">You need to sign in</h2>
          <p className="text-muted-foreground">Log back in to customize your experience.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-[#2C6485]">Settings</h1>
        <p className="text-gray-600">Tweak, toggle, personalize. (We love a good settings page.)</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {message}
        </div>
      )}

      <section className="bg-white rounded-2xl border p-6 space-y-4">
        <h2 className="text-xl font-semibold">Profile</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-2">Display name</label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="How your matches see you" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input value={user.email} disabled className="bg-gray-100 dark:bg-gray-800" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Timezone</label>
          <Input
            value={settings.timezone}
            onChange={(e) => handleToggle("timezone")(e.target.value)}
            placeholder="e.g., America/New_York"
          />
          <p className="text-xs text-muted-foreground mt-1">We use this for reminders and scheduling suggestions.</p>
        </div>
      </section>

      <section className="bg-white rounded-2xl border p-6 space-y-4">
        <h2 className="text-xl font-semibold">Notifications</h2>
        <SettingToggle
          label="Email updates"
          description="Weekly summaries, match nudges, and important news."
          checked={settings.emailUpdates}
          onCheckedChange={(value) => handleToggle("emailUpdates")(value)}
        />
        <SettingToggle
          label="Match alerts"
          description="Get notified when a mentor or mentee responds."
          checked={settings.matchAlerts}
          onCheckedChange={(value) => handleToggle("matchAlerts")(value)}
        />
        <SettingToggle
          label="Call reminders"
          description="15-minute reminders before scheduled sessions."
          checked={settings.callReminders}
          onCheckedChange={(value) => handleToggle("callReminders")(value)}
        />
        <div className="pt-2">
          <label className="block text-sm font-medium mb-1">Goal digest frequency</label>
          <div className="flex gap-3">
            {digestOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleToggle("digestFrequency")(option)}
                className={`px-3 py-1 rounded-full text-sm border ${
                  settings.digestFrequency === option ? "bg-[#645990] text-white border-[#645990]" : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border p-6 space-y-4">
        <h2 className="text-xl font-semibold">Privacy</h2>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Profile visibility</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleToggle("profileVisibility")("community")}
              className={`px-3 py-2 rounded-lg border text-sm ${
                settings.profileVisibility === "community" ? "border-[#85BCB1] bg-[#85BCB1]/10 text-[#2C6485]" : "border-gray-300"
              }`}
            >
              Community
            </button>
            <button
              type="button"
              onClick={() => handleToggle("profileVisibility")("matches-only")}
              className={`px-3 py-2 rounded-lg border text-sm ${
                settings.profileVisibility === "matches-only" ? "border-[#85BCB1] bg-[#85BCB1]/10 text-[#2C6485]" : "border-gray-300"
              }`}
            >
              Matches only
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Choose whether the community can discover you, or limit visibility to people you already match with.
          </p>
        </div>
      </section>

      <section className="bg-white rounded-2xl border p-6 space-y-4">
        <h2 className="text-xl font-semibold">Danger zone</h2>
        <p className="text-sm text-muted-foreground">
          Need a reset? You can pause notifications or delete your account entirely.
        </p>
        <Button variant="destructive" onClick={handleDeleteAccount}>
          Delete account
        </Button>
      </section>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save settings"}
        </Button>
      </div>
    </div>
  );
}

function SettingToggle({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border rounded-2xl px-4 py-3">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}