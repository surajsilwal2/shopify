"use client";

import { registerContract } from "@repo/api-contract";
import { useForm } from "react-hook-form";
import AuthLayout from "@/components/shared/auth/auth-layout";
import AuthInput from "@/components/shared/auth/auth-input";
import { Lock, Mail, User } from "lucide-react";
import { z } from "zod";
import { useRegister } from "@/hooks/auth-hook";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthButton } from "@/components/shared/auth/auth-button";

const signupFormSchema = registerContract.body
  .extend({
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword);

type signupForm = z.infer<typeof signupFormSchema>;

const SignupPage = () => {
  const { mutate: register, isPending } = useRegister();

  const {
    register: field,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<signupForm>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");
  const strength = !password
    ? 0
    : password.length < 6
      ? 1
      : password.length < 10
        ? 2
        : 3;
  const strengthLabel = ["", "Weak", "Good", "Strong"];
  const strengthColor = ["", "bg-red-500", "bg-amber-400", "bg-emerald-400"];

  const onSubmit = (data: signupForm) => {
    (sessionStorage.setItem("pendingPassword", data.password),
      register({ name: data.name, email: data.email }));
  };
 return (
   <AuthLayout
     title="Create account"
     subtitle="Start your shopping journey today"
     backLink={{
       href: "/login",
       label: "Sign in",
       text: "Already have an account?",
     }}
   >
     <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
       <AuthInput
         label="Full name"
         placeholder="John Doe"
         icon={<User className="h-4 w-4" />}
         error={errors.name?.message}
         {...field("name")}
       />

       <AuthInput
         label="Email address"
         type="email"
         placeholder="you@example.com"
         icon={<Mail className="h-4 w-4" />}
         error={errors.email?.message}
         {...field("email")}
       />

       <div className="space-y-2">
         <AuthInput
           label="Password"
           type="password"
           placeholder="••••••••"
           icon={<Lock className="h-4 w-4" />}
           error={errors.password?.message}
           {...field("password")}
         />
         {password && (
           <div className="flex items-center gap-2">
             <div className="flex gap-1 flex-1">
               {[1, 2, 3].map((i) => (
                 <div
                   key={i}
                   className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                     i <= strength ? strengthColor[strength] : "bg-white/10"
                   }`}
                 />
               ))}
             </div>
             <span
               className={`text-xs font-medium ${
                 strength === 1
                   ? "text-red-400"
                   : strength === 2
                     ? "text-amber-400"
                     : "text-emerald-400"
               }`}
             >
               {strengthLabel[strength]}
             </span>
           </div>
         )}
       </div>

       <AuthInput
         label="Confirm password"
         type="password"
         placeholder="••••••••"
         icon={<Lock className="h-4 w-4" />}
         error={errors.confirmPassword?.message}
         {...field("confirmPassword")}
       />

       <AuthButton loading={isPending} type="submit">
         Create Account
       </AuthButton>

       <p className="text-center text-xs text-slate-600">
         By signing up you agree to our{" "}
         <a href="#" className="text-amber-400/70 hover:text-amber-400">
           Terms
         </a>{" "}
         and{" "}
         <a href="#" className="text-amber-400/70 hover:text-amber-400">
           Privacy Policy
         </a>
       </p>
     </form>
   </AuthLayout>
 );
};

export default SignupPage;
