'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminMessagesPage() {

    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {

       const res = await fetch("/api/contact/list", {
  cache: "no-store",
});
        if (res.status === 401) {
            router.push("/admin/login");
            return;
        }
        const data = await res.json();

        setMessages(data.messages || []);
        setLoading(false);
    };

    const updateStatus = async (id: string, status: string) => {

        await fetch("/api/contact/update-status", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ id, status }),
        });

        // Update UI immediately
        setMessages((prev) =>
            prev.map((msg) =>
                msg.id === id ? { ...msg, status } : msg
            )
        );
    };

    const deleteMessage = async (id: string) => {

        if (!confirm("Delete this message?")) return;

        const res = await fetch("/api/contact/delete", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ id }),
        });

        if (res.ok) {
            // remove from UI instantly
            setMessages((prev) => prev.filter((msg) => msg.id !== id));
        }

    };

    if (loading) {
        return <p className="text-center py-20">Loading messages...</p>;
    }

    return (
        <div className="min-h-screen bg-gray-100 py-12">

            <div className="max-w-7xl mx-auto px-6">

                <h1 className="text-4xl font-bold mb-8 text-primary">
                    Contact Inbox
                </h1>

                <div className="bg-white rounded-xl shadow-xl overflow-hidden">

                    <table className="w-full text-sm">

                        <thead className="bg-primary text-black">
                            <tr className="border-b border-gray-300">
                                <th className="p-4 text-left">Name</th>
                                <th className="p-4 text-left">Email</th>
                                <th className="p-4 text-left">Message</th>
                                <th className="p-4 text-left">Received</th>
                                <th className="p-4 text-left">Status</th>
                                <th className="p-4 text-left">Actions</th>
                            </tr>
                        </thead>

                        <tbody>

                            {messages.map((msg) => (

                                <tr
  key={msg.id}
  className={`border-b border-gray-300 hover:bg-blue-50 transition cursor-pointer
    ${
      msg.status === "Unread"
        ? "bg-yellow-50 font-semibold"
        : "bg-gray-200 text-gray-500"
    }
  `}
>

                                    <td className="p-4 font-semibold">
                                        {msg.name}
                                    </td>

                                    <td className="p-4 text-gray-600">
                                        {msg.email}
                                    </td>

                                    <td className="p-4 max-w-xs break-words">
                                        {msg.message}
                                    </td>
                                    <td className="p-4 text-gray-600 text-sm">
  {new Date(msg.created_at).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })}

  <div className="text-xs text-gray-400">
    {new Date(msg.created_at).toLocaleTimeString()}
  </div>
</td>
                                    <td className="p-4">

                                        <div className="flex items-center gap-2 font-semibold">

                                            <span
                                                className={`w-3 h-3 rounded-full
        ${msg.status?.toLowerCase() === "read"
                                                        ? "bg-green-500"
                                                        : "bg-yellow-400"
                                                    }`}
                                            ></span>

                                            <span className="text-gray-700 text-sm">
                                                {msg.status || "Unread"}
                                            </span>

                                        </div>

                                    </td>
                                    <td className="p-4">

                                        <div className="flex gap-2">

                                            {msg.status === "Unread" && (

                                                <button
                                                    onClick={() => updateStatus(msg.id, "Read")}
                                                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition"
                                                >
                                                    Mark Read
                                                </button>

                                            )}

                                            {msg.status === "Read" && (

                                                <button
                                                    onClick={() => updateStatus(msg.id, "Unread")}
                                                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition"
                                                >
                                                    Mark Unread
                                                </button>

                                            )}

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteMessage(msg.id);
                                                }}
                                                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                                            >
                                                Delete
                                            </button>

                                        </div>

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>
    );
}
