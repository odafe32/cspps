"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings, Save, Database, Cpu, GitBranch, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ProfileSection } from "@/components/settings/profile-section";

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    systemName: "CSPPS",
    institution: "Tertiary Institution",
    gpaScale: "5.0",
    riskThresholdHigh: "2.0",
    riskThresholdMedium: "3.0",
    notificationPolling: "15",
  });

  function update(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success("Settings Saved", { description: "System settings have been updated" });
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Configure system-wide settings
        </p>
      </div>

      {/* Profile section */}
      <ProfileSection />

      {/* System info */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-xs text-muted-foreground">Version</p>
              <p className="text-lg font-bold">1.0.0</p>
            </div>
            <GitBranch className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-xs text-muted-foreground">Database</p>
              <p className="text-lg font-bold">PostgreSQL</p>
            </div>
            <Database className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-xs text-muted-foreground">ML Engine</p>
              <p className="text-lg font-bold">ONNX</p>
            </div>
            <Cpu className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {/* General settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            General Settings
          </CardTitle>
          <CardDescription>System configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="systemName">System Name</Label>
              <Input id="systemName" value={settings.systemName} onChange={(e) => update("systemName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="institution">Institution Name</Label>
              <Input id="institution" value={settings.institution} onChange={(e) => update("institution", e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gpaScale">GPA Scale</Label>
              <Input id="gpaScale" value={settings.gpaScale} onChange={(e) => update("gpaScale", e.target.value)} disabled />
              <p className="text-xs text-muted-foreground">5.0 Nigerian scale</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notificationPolling">Notification Polling (seconds)</Label>
              <Input id="notificationPolling" type="number" value={settings.notificationPolling} onChange={(e) => update("notificationPolling", e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk thresholds */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Thresholds</CardTitle>
          <CardDescription>
            GPA thresholds for risk classification (5.0 scale)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="riskThresholdHigh">High Risk (below)</Label>
              <Input id="riskThresholdHigh" type="number" step="0.1" value={settings.riskThresholdHigh} onChange={(e) => update("riskThresholdHigh", e.target.value)} />
              <p className="text-xs text-muted-foreground">Students with predicted GPA below this are HIGH risk</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="riskThresholdMedium">Medium Risk (below)</Label>
              <Input id="riskThresholdMedium" type="number" step="0.1" value={settings.riskThresholdMedium} onChange={(e) => update("riskThresholdMedium", e.target.value)} />
              <p className="text-xs text-muted-foreground">Students between this and high threshold are MEDIUM risk</p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center gap-4 text-sm">
            <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">HIGH: &lt; {settings.riskThresholdHigh}</Badge>
            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">MEDIUM: {settings.riskThresholdHigh} - {settings.riskThresholdMedium}</Badge>
            <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">LOW: &ge; {settings.riskThresholdMedium}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* ML Model info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-muted-foreground" />
            ML Model Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">GPA Regressor</span>
            <Badge variant="secondary">Random Forest</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Risk Classifier</span>
            <Badge variant="secondary">Gradient Boosting</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Features</span>
            <span className="font-medium">7</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Training Data</span>
            <span className="font-medium">3,000 samples (synthetic)</span>
          </div>
          <Separator />
          <p className="text-xs text-muted-foreground">
            Implementation: Godfrey Joseph
          </p>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
