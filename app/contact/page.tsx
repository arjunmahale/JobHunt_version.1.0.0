"use client";

import { useState } from "react";
import Link from "next/link";

export default function ContactPage() {

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setSuccess("Your message has been sent successfully!");

      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });

    } catch (err: any) {
      setError(err.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">

      {/* Page Title */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-primary mb-4">
          Contact Us
        </h1>

        <p className="text-gray-900 text-lg">
          Have questions or feedback? We'd love to hear from you.
        </p>
      </div>

      {/* Contact Info */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-10">

        <h2 className="text-2xl font-semibold mb-4">
          Get in Touch
        </h2>

        <p className="text-gray-700 mb-4">
          If you have any questions regarding job listings, suggestions,
          or website issues, please contact us using the form below.
        </p>

      </div>

      {/* Contact Form */}
      <div className="bg-white rounded-lg shadow-md p-8">

        <h2 className="text-2xl font-semibold mb-6">
          Send Us a Message
        </h2>

        {success && (
          <div className="bg-green-100 text-green-700 p-4 rounded mb-6">
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Name
            </label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Your Name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Your Email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Subject
            </label>

            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Subject"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Message
            </label>

            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={5}
              required
              placeholder="Write your message..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Message"}
          </button>

        </form>

      </div>

      {/* Back to Jobs */}
      <div className="text-center mt-10">
        <Link
          href="/jobs"
          className="text-secondary font-semibold hover:text-blue-600"
        >
          Browse Jobs →
        </Link>
      </div>

    </div>
  );
}