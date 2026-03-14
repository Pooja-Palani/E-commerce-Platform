import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterRequest } from "@shared/schema";
import { useRegister } from "@/hooks/use-auth-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Link, useSearch } from "wouter";
import { Eye, EyeOff } from "lucide-react";

const RequiredAsterisk = () => <span className="text-destructive">*</span>;

export default function Register() {
  const register = useRegister();
  const [showPassword, setShowPassword] = useState(false);
  const search = useSearch();
  const inviteCommunityId = typeof search === "string" ? new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get("invite") : null;

  const form = useForm<RegisterRequest>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      phone: "",
      locality: "",
      postalCode: "",
      unitFlatNumber: "",
      address: "",
      bio: ""
    },
  });

  const onSubmit = (d: RegisterRequest) => {
    register.mutate(inviteCommunityId ? { ...d, inviteCommunityId } : d);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 py-12">
      <div className="w-full max-w-3xl">
        <Card className="border-border/50 shadow-xl shadow-black/5">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center font-bold">Create an account</CardTitle>
            <CardDescription className="text-center">
              {inviteCommunityId ? "You've been invited to join a community. Sign up to get started." : "Enter your details to join your community"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 text-center">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name <RequiredAsterisk /></FormLabel>
                          <FormControl>
                            <Input placeholder="Arun Kumar" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email <RequiredAsterisk /></FormLabel>
                          <FormControl>
                            <Input placeholder="arun@qvantomarket.in" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone <RequiredAsterisk /></FormLabel>
                          <FormControl>
                            <Input placeholder="+91 98765 43210" {...field} value={field.value || ''} />
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
                  </div>

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="locality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Locality <RequiredAsterisk /></FormLabel>
                          <FormControl>
                            <Input placeholder="Adyar" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal Code <RequiredAsterisk /></FormLabel>
                          <FormControl>
                            <Input placeholder="600020" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="unitFlatNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit / Flat number</FormLabel>
                          <FormControl>
                            <Input placeholder="A-101" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address <RequiredAsterisk /></FormLabel>
                          <FormControl>
                            <Input placeholder="12, 1st Cross St, Indira Nagar" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Passionate community member" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Button type="submit" className="px-12 py-2 h-auto" disabled={register.isPending}>
                  {register.isPending ? "Creating account..." : "Sign up"}
                </Button>
              </form>
            </Form>
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
