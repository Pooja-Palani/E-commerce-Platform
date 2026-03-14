import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { LoginRequest, RegisterRequest } from "@shared/schema";
import { useAuthStore } from "@/store/use-auth";
import { useCartStore } from "@/store/use-cart";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { getErrorMessage } from "@/lib/api-error";

export function useAuth() {
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);

  return useQuery({
    queryKey: [api.auth.me.path],
    queryFn: async () => {
      try {
        const res = await fetch(api.auth.me.path, { credentials: "include" });
        if (!res.ok) {
          const message = await getErrorMessage(res, "Failed to fetch user");
          throw new Error(message);
        }
        const data = await res.json();
        const parsed = api.auth.me.responses[200].parse(data);
        setUser(parsed ?? null);
        return parsed ?? null;
      } catch (err) {
        setUser(null);
        return null;
      } finally {
        setLoading(false);
      }
    },
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const message = await getErrorMessage(res, "Login failed");
        throw new Error(message);
      }
      return api.auth.login.responses[200].parse(await res.json());
    },
    onSuccess: (user) => {
      queryClient.setQueryData([api.auth.me.path], user);
      useAuthStore.getState().setUser(user);
      setLocation("/");
      toast({ title: "Welcome back", description: `Logged in as ${user.fullName}` });
    },
    onError: (err: Error) => {
      toast({ title: "Login Failed", description: err.message, variant: "destructive" });
    }
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  return useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const res = await fetch(api.auth.register.path, {
        method: api.auth.register.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (res.status === 400) {
        const err = api.auth.register.responses[400].parse(await res.json());
        throw new Error(err.message);
      }
      if (!res.ok) {
        const message = await getErrorMessage(res, "Registration failed");
        throw new Error(message);
      }
      return api.auth.register.responses[201].parse(await res.json());
    },
    onSuccess: (user) => {
      queryClient.setQueryData([api.auth.me.path], user);
      useAuthStore.getState().setUser(user);
      setLocation("/onboarding/communities");
      toast({ title: "Account created", description: `Welcome, ${user.fullName}! Let's find your community.` });
    },
    onError: (err: Error) => {
      toast({ title: "Registration Failed", description: err.message, variant: "destructive" });
    }
  });
}

export function useRequestOtp() {
  return useMutation({
    mutationFn: async (email: string) => {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to send OTP");
      }
      return res.json();
    },
  });
}

export function useLoginWithOtp() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  return useMutation({
    mutationFn: async ({ email, otp }: { email: string; otp: string }) => {
      const res = await fetch("/api/auth/login-with-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim() }),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Invalid OTP");
      }
      return res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData([api.auth.me.path], user);
      useAuthStore.getState().setUser(user);
      setLocation("/");
      toast({ title: "Signed in", description: `Welcome, ${user.fullName}` });
    },
    onError: (err: Error) => {
      toast({ title: "OTP login failed", description: err.message, variant: "destructive" });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  return useMutation({
    mutationFn: async () => {
      await fetch(api.auth.logout.path, { method: api.auth.logout.method, credentials: "include" });
    },
    onSuccess: () => {
      queryClient.setQueryData([api.auth.me.path], null);
      useAuthStore.getState().setUser(null);
      useCartStore.getState().clearCart();
      setLocation("/login");
    }
  });
}
