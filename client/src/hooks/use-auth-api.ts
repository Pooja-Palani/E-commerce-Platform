import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { LoginRequest, RegisterRequest } from "@shared/schema";
import { useAuthStore } from "@/store/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export function useAuth() {
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);

  return useQuery({
    queryKey: [api.auth.me.path],
    queryFn: async () => {
      try {
        const res = await fetch(api.auth.me.path, { credentials: "include" });
        if (res.status === 401) {
          setUser(null);
          return null;
        }
        if (!res.ok) throw new Error("Failed to fetch user");
        const data = await res.json();
        const parsed = api.auth.me.responses[200].parse(data);
        setUser(parsed);
        return parsed;
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
      if (res.status === 401) throw new Error("Invalid credentials");
      if (!res.ok) throw new Error("Login failed");
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
      if (!res.ok) throw new Error("Registration failed");
      return api.auth.register.responses[201].parse(await res.json());
    },
    onSuccess: (user) => {
      queryClient.setQueryData([api.auth.me.path], user);
      useAuthStore.getState().setUser(user);
      setLocation("/");
      toast({ title: "Account created", description: `Welcome, ${user.fullName}!` });
    },
    onError: (err: Error) => {
      toast({ title: "Registration Failed", description: err.message, variant: "destructive" });
    }
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
      setLocation("/login");
    }
  });
}
