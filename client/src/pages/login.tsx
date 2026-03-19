import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginRequest } from "@shared/schema";
import { useLogin, useRequestOtp, useLoginWithOtp } from "@/hooks/use-auth-api";
import { usePublicBranding } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Link } from "wouter";
import { ShoppingBag, Eye, EyeOff, KeyRound } from "lucide-react";

const RequiredAsterisk = () => <span className="text-destructive">*</span>;

type LoginMode = "password" | "otp";

export default function Login() {
  const login = useLogin();
  const requestOtp = useRequestOtp();
  const loginWithOtp = useLoginWithOtp();
  const [showPassword, setShowPassword] = useState(false);
  const { data: branding } = usePublicBranding();
  const [mode, setMode] = useState<LoginMode>("password");
  const [otpEmail, setOtpEmail] = useState("");
  const [otp, setOtp] = useState("");

  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const handleOtpLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpEmail.trim() || !otp.trim()) return;
    loginWithOtp.mutate({ email: otpEmail.trim(), otp: otp.trim() });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3 font-bold text-3xl tracking-tight text-primary">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
              {branding?.platformLogoUrl ? (
                <img src={branding.platformLogoUrl} alt="Platform logo" className="w-full h-full object-cover" />
              ) : (
                <ShoppingBag className="w-6 h-6" />
              )}
            </div>
            {branding?.platformName || "Qvanto Market"}
          </div>
        </div>
        <Card className="border-border/50 shadow-xl shadow-black/5">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4 p-1 rounded-lg bg-muted/50">
              <Button type="button" variant={mode === "password" ? "secondary" : "ghost"} size="sm" className="flex-1" onClick={() => setMode("password")}>Password</Button>
              <Button type="button" variant={mode === "otp" ? "secondary" : "ghost"} size="sm" className="flex-1" onClick={() => setMode("otp")}><KeyRound className="w-3.5 h-3.5 mr-1" /> OTP</Button>
            </div>

            {mode === "password" && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit((d) => login.mutate(d))} className="space-y-4">
                  {login.isError && (
                    <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                      {login.error?.message}
                    </div>
                  )}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email <RequiredAsterisk /></FormLabel>
                        <FormControl>
                          <Input placeholder="name@example.com" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password <RequiredAsterisk /></FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              className="pr-9"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              aria-label={showPassword ? "Hide password" : "Show password"}
                              onClick={() => setShowPassword((p) => !p)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={login.isPending}>
                    {login.isPending ? "Signing in..." : "Sign in"}
                  </Button>
                </form>
              </Form>
            )}

            {mode === "otp" && (
              <form onSubmit={handleOtpLogin} className="space-y-4">
                {loginWithOtp.isError && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">{loginWithOtp.error?.message}</div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email <RequiredAsterisk /></label>
                  <div className="flex gap-2">
                    <Input placeholder="name@example.com" type="email" value={otpEmail} onChange={(e) => setOtpEmail(e.target.value)} className="flex-1" />
                    <Button type="button" variant="outline" disabled={!otpEmail.trim() || requestOtp.isPending} onClick={() => requestOtp.mutate(otpEmail)}>
                      {requestOtp.isPending ? "Sending..." : "Send OTP"}
                    </Button>
                  </div>
                  {requestOtp.isSuccess && <p className="text-xs text-muted-foreground">Use any 4+ character code (dummy mode)</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">OTP <RequiredAsterisk /></label>
                  <Input placeholder="e.g. 1234" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={8} />
                </div>
                <Button type="submit" className="w-full" disabled={loginWithOtp.isPending || !otpEmail.trim() || !otp.trim()}>
                  {loginWithOtp.isPending ? "Signing in..." : "Sign in with OTP"}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link href="/register" className="text-primary font-medium hover:underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
