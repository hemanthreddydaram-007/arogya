"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Lock, Mail, User, Heart, X, AlertCircle, Loader2 } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [age, setAge] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign Up with Supabase Auth & attach metadata
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              blood_group: bloodGroup,
              age: age ? parseInt(age, 10) : null,
            },
          },
        });

        if (error) throw error;

        // If email confirmation is disabled in Supabase, user is immediately logged in
        if (data.session) {
          // Sync with the profiles table if profile exists
          await supabase.from("profiles").upsert({
            id: data.user?.id,
            name: fullName.trim() || email.split("@")[0],
            blood_group: bloodGroup,
            age: age ? parseInt(age, 10) : null,
            gender: "Not Specified",
            allergies: []
          });
          onSuccess();
          onClose();
        } else {
          setInfoMessage("Registration successful! Please check your email to verify your account or proceed to log in.");
          setIsSignUp(false);
        }
      } else {
        // Sign In with Email & Password
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        if (data.session) {
          onSuccess();
          onClose();
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Authentication failed. Please verify your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-[#0A0E1A] border border-white/10 p-7 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-neutral-400 hover:text-white transition p-1 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-500 p-[1px]">
            <div className="w-full h-full bg-[#030712] rounded-2xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white tracking-tight">
              {isSignUp ? "Create Health Account" : "Access Health Copilot"}
            </h2>
            <p className="text-xs text-neutral-400 font-mono">
              {isSignUp ? "Register with your clinical profile" : "Sign in using your email & password"}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-white/[0.04] p-1 rounded-xl mb-5 border border-white/[0.06]">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setErrorMessage(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
              !isSignUp ? "bg-cyan-500 text-neutral-950 shadow" : "text-neutral-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setErrorMessage(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
              isSignUp ? "bg-cyan-500 text-neutral-950 shadow" : "text-neutral-400 hover:text-white"
            }`}
          >
            Sign Up
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {infoMessage && (
          <div className="mb-4 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{infoMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <label className="block text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.08] focus:border-cyan-500 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-1">
                    Blood Group
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#0A0E1A] border border-white/[0.08] focus:border-cyan-500 rounded-xl text-xs text-white focus:outline-none"
                  >
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 30"
                    className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] focus:border-cyan-500 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="patient@healthcare.in"
                className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.08] focus:border-cyan-500 rounded-xl text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.08] focus:border-cyan-500 rounded-xl text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-neutral-950 font-extrabold text-xs rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.25)] transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Request...</span>
              </>
            ) : (
              <span>{isSignUp ? "Complete Registration" : "Sign In to Account"}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}