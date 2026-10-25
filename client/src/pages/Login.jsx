import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import AuthInput from "../components/AuthInput";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  const onSubmit = async ({ email, password }) => {
    setServerError("");
    try {
      await login(email, password);
      navigate("/contacts");
    } catch (err) {
      setServerError(err.response?.data?.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <AuthLayout>
      <h1 className="font-serif text-3xl font-semibold text-ink">Welcome Back</h1>
      <p className="mt-1 text-sm text-muted">Login to your Connectly account</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        <AuthInput
          label="Email Address"
          icon={Mail}
          type="email"
          placeholder="you@example.com"
          registerProps={register("email", {
            required: "Email is required",
            pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email" },
          })}
          error={errors.email?.message}
        />
        <AuthInput
          label="Password"
          icon={Lock}
          type="password"
          placeholder="Enter your password"
          registerProps={register("password", { required: "Password is required" })}
          error={errors.password?.message}
        />

        {serverError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{serverError}</p>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
        >
          Login <ArrowRight size={18} />
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        New here?{" "}
        <Link to="/signup" className="font-medium text-accent underline">
          Create your account
        </Link>
      </p>
    </AuthLayout>
  );
}