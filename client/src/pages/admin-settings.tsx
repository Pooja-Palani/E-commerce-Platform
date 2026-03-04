import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings2, Save, Bell, Shield, Mail, Globe, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAdminSettings, useUpdateAdminSettings } from "@/hooks/use-admin";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useState, useEffect } from "react";
import { UpdatePlatformSettingsRequest } from "@shared/schema";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function AdminSettings() {
    const { toast } = useToast();
    const { data: settings, isLoading } = useAdminSettings();
    const updateSettings = useUpdateAdminSettings();

    const [formData, setFormData] = useState<UpdatePlatformSettingsRequest>({});
    const [activeTab, setActiveTab] = useState<"general" | "security" | "notifications" | "email" | "backups">("general");

    useEffect(() => {
        if (settings) {
            setFormData({
                platformName: settings.platformName,
                supportEmail: settings.supportEmail,
                commissionRate: settings.commissionRate,
                enableRegistration: settings.enableRegistration,
                enableGlobalMarketplace: settings.enableGlobalMarketplace,
                enableCommunityForums: settings.enableCommunityForums,
                maintenanceMode: settings.maintenanceMode,
                require2FA: settings.require2FA,
                sessionTimeout: settings.sessionTimeout,
                emailAlerts: settings.emailAlerts,
                welcomeEmailSubject: settings.welcomeEmailSubject,
                autoBackupFrequency: settings.autoBackupFrequency,
            });
        }
    }, [settings]);

    if (isLoading || !settings) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-full min-h-[50vh]"><LoadingSpinner /></div>
            </Layout>
        );
    }

    const handleSave = () => {
        updateSettings.mutate(formData, {
            onSuccess: () => {
                toast({
                    title: "Settings saved",
                    description: "Your platform settings have been updated successfully.",
                });
            }
        });
    };

    const updateField = (key: keyof UpdatePlatformSettingsRequest, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    return (
        <Layout>
            <div className="space-y-8 pb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                            <div className="w-8 h-8 flex items-center justify-center bg-blue-50 rounded-lg text-[#1e3a8a] py-2">
                                <Settings2 className="w-4 h-4" />
                            </div> Platform Settings
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm font-medium">Manage global configurations and system preferences.</p>
                    </div>
                    <Button onClick={handleSave} disabled={updateSettings.isPending} className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 font-bold px-6">
                        <Save className="w-4 h-4 mr-2" /> {updateSettings.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-2">
                        <div
                            onClick={() => setActiveTab("general")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium cursor-pointer transition-colors ${activeTab === "general" ? "bg-blue-50 text-[#1e3a8a]" : "text-slate-600 hover:bg-slate-50"}`}
                        >
                            <Globe className="w-4 h-4" /> General
                        </div>
                        <div
                            onClick={() => setActiveTab("security")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium cursor-pointer transition-colors ${activeTab === "security" ? "bg-blue-50 text-[#1e3a8a]" : "text-slate-600 hover:bg-slate-50"}`}
                        >
                            <Shield className="w-4 h-4" /> Security & Auth
                        </div>
                        <div
                            onClick={() => setActiveTab("notifications")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium cursor-pointer transition-colors ${activeTab === "notifications" ? "bg-blue-50 text-[#1e3a8a]" : "text-slate-600 hover:bg-slate-50"}`}
                        >
                            <Bell className="w-4 h-4" /> Notifications
                        </div>
                        <div
                            onClick={() => setActiveTab("email")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium cursor-pointer transition-colors ${activeTab === "email" ? "bg-blue-50 text-[#1e3a8a]" : "text-slate-600 hover:bg-slate-50"}`}
                        >
                            <Mail className="w-4 h-4" /> Email Templates
                        </div>
                        <div
                            onClick={() => setActiveTab("backups")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium cursor-pointer transition-colors ${activeTab === "backups" ? "bg-blue-50 text-[#1e3a8a]" : "text-slate-600 hover:bg-slate-50"}`}
                        >
                            <Database className="w-4 h-4" /> Backups
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        {activeTab === "general" && (
                            <>
                                <Card className="border-border/50 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-bold text-slate-900">Platform Identity</CardTitle>
                                        <CardDescription>Configure the primary details of the marketplace platform.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="platformName" className="font-bold text-slate-700">Platform Name</Label>
                                            <Input
                                                id="platformName"
                                                value={formData.platformName || ""}
                                                onChange={(e) => updateField("platformName", e.target.value)}
                                                className="max-w-md h-10"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="contactEmail" className="font-bold text-slate-700">Support Email</Label>
                                            <Input
                                                id="contactEmail"
                                                value={formData.supportEmail || ""}
                                                onChange={(e) => updateField("supportEmail", e.target.value)}
                                                className="max-w-md h-10"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="commission" className="font-bold text-slate-700">Default Commission Rate (%)</Label>
                                            <Input
                                                id="commission"
                                                type="number"
                                                value={formData.commissionRate ?? 0}
                                                onChange={(e) => updateField("commissionRate", parseInt(e.target.value) || 0)}
                                                className="max-w-xs h-10"
                                            />
                                            <p className="text-[10px] text-muted-foreground mt-1">This rate applies to all global marketplace transactions unless overridden.</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-border/50 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-bold text-slate-900">Feature Flags</CardTitle>
                                        <CardDescription>Enable or disable core platform features.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label className="text-base font-bold text-slate-900">User Registration</Label>
                                                <p className="text-sm text-slate-500 font-medium">Allow new users to create accounts.</p>
                                            </div>
                                            <Switch
                                                checked={formData.enableRegistration ?? true}
                                                onCheckedChange={(checked) => updateField("enableRegistration", checked)}
                                            />
                                        </div>
                                        <Separator />
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label className="text-base font-bold text-slate-900">Global Marketplace</Label>
                                                <p className="text-sm text-slate-500 font-medium">Enable the public marketplace for all users.</p>
                                            </div>
                                            <Switch
                                                checked={formData.enableGlobalMarketplace ?? true}
                                                onCheckedChange={(checked) => updateField("enableGlobalMarketplace", checked)}
                                            />
                                        </div>
                                        <Separator />
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label className="text-base font-bold text-slate-900">Community Forums</Label>
                                                <p className="text-sm text-slate-500 font-medium">Enable discussion boards for residential communities.</p>
                                            </div>
                                            <Switch
                                                checked={formData.enableCommunityForums ?? true}
                                                onCheckedChange={(checked) => updateField("enableCommunityForums", checked)}
                                            />
                                        </div>
                                        <Separator />
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label className="text-base font-bold text-slate-900">Maintenance Mode</Label>
                                                <p className="text-sm text-slate-500 font-medium">Put the entire platform into maintenance mode (Admins only).</p>
                                            </div>
                                            <Switch
                                                checked={formData.maintenanceMode ?? false}
                                                onCheckedChange={(checked) => updateField("maintenanceMode", checked)}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}

                        {activeTab === "security" && (
                            <Card className="border-border/50 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg font-bold text-slate-900">Security & Authentication</CardTitle>
                                    <CardDescription>Manage password policies and session limits.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-base font-bold text-slate-900">Require 2FA</Label>
                                            <p className="text-sm text-slate-500 font-medium">Force all administrative users to use Two-Factor Authentication.</p>
                                        </div>
                                        <Switch
                                            checked={formData.require2FA ?? false}
                                            onCheckedChange={(checked) => updateField("require2FA", checked)}
                                        />
                                    </div>
                                    <Separator />
                                    <div className="space-y-2">
                                        <Label htmlFor="sessionTimeout" className="font-bold text-slate-700">Session Timeout (Hours)</Label>
                                        <Input
                                            id="sessionTimeout"
                                            type="number"
                                            value={formData.sessionTimeout ?? 24}
                                            onChange={(e) => updateField("sessionTimeout", parseInt(e.target.value) || 24)}
                                            className="max-w-xs h-10"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === "notifications" && (
                            <Card className="border-border/50 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg font-bold text-slate-900">Global Notifications</CardTitle>
                                    <CardDescription>Configure system-wide alerts and messaging behavior.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-base font-bold text-slate-900">Enable Email Alerts</Label>
                                            <p className="text-sm text-slate-500 font-medium">Send automated emails for critical system events.</p>
                                        </div>
                                        <Switch
                                            checked={formData.emailAlerts ?? true}
                                            onCheckedChange={(checked) => updateField("emailAlerts", checked)}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === "email" && (
                            <Card className="border-border/50 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg font-bold text-slate-900">Email Templates</CardTitle>
                                    <CardDescription>Customize the content of automated emails sent to users.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="welcomeSubject" className="font-bold text-slate-700">Welcome Email Subject</Label>
                                        <Input
                                            id="welcomeSubject"
                                            value={formData.welcomeEmailSubject || ""}
                                            onChange={(e) => updateField("welcomeEmailSubject", e.target.value)}
                                            className="max-w-md h-10"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === "backups" && (
                            <Card className="border-border/50 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg font-bold text-slate-900">Database Backups</CardTitle>
                                    <CardDescription>Configure automated snapshot and backup behaviors.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="font-bold text-slate-700">Auto Backup Frequency</Label>
                                        <Select
                                            value={formData.autoBackupFrequency || "daily"}
                                            onValueChange={(val) => updateField("autoBackupFrequency", val)}
                                        >
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder="Select frequency" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="hourly">Hourly</SelectItem>
                                                <SelectItem value="daily">Daily</SelectItem>
                                                <SelectItem value="weekly">Weekly</SelectItem>
                                                <SelectItem value="monthly">Monthly</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button variant="outline" className="mt-4" onClick={(e) => { e.preventDefault(); toast({ title: "Backup trigger started", description: "Manual backup routine has been initiated." }) }}>
                                        Trigger Manual Backup Now
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                    </div>
                </div>
            </div>
        </Layout>
    );
}
