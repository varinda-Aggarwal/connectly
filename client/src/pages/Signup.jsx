import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, ArrowRight } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import AuthInput from "../components/AuthInput";
import { useAuth } from "../context/AuthContext";

const validatePassword = (value) => {
  if (value.length < 8) return "Password must be at least 8 characters";
  if (!/[a-z]/.test(value)) return "Add at least one lowercase letter";
  if (!/[A-Z]/.test(value)) return "Add at least one uppercase letter";
  if (!/[0-9]/.test(value)) return "Add at least one number";
  if (!/[^A-Za-z0-9\s]/.test(value)) return "Add at least one special character";
  return true;
};

export default function Signup() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  const onSubmit = async ({ name, email, password }) => {
    setServerError("");
    try {
      await registerUser(name, email, password);
      navigate("/contacts");
    } catch (err) {
      setServerError(err.response?.data?.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <AuthLayout>
      <h1 className="font-serif text-3xl font-semibold text-ink">Create Your Account</h1>
      <p className="mt-1 text-sm text-muted">Get started with your Connectly account</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-3.5" noValidate>
        <AuthInput
          label="Full Name"
          icon={User}
          placeholder="Enter your full name"
          registerProps={register("name", {
            required: "Name is required",
            minLength: { value: 2, message: "Name is too short" },
          })}
          error={errors.name?.message}
        />
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
          placeholder="Create a password"
          registerProps={register("password", {
            required: "Password is required",
            validate: validatePassword,
          })}
          error={errors.password?.message}
        />
        <AuthInput
          label="Confirm Password"
          icon={Lock}
          type="password"
          placeholder="Confirm your password"
          registerProps={register("confirmPassword", {
            required: "Please confirm your password",
            validate: (value) => value === watch("password") || "Passwords do not match",
          })}
          error={errors.confirmPassword?.message}
        />

        {serverError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{serverError}</p>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
        >
          Sign Up <ArrowRight size={18} />
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-accent underline">
          Login
        </Link>
      </p>
    </AuthLayout>
  );
}