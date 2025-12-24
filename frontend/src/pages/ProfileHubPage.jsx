import React from "react";
import { getMe, updateMe } from "../services/api";

export default function ProfileHubPage() {
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [success, setSuccess] = React.useState(null);

    const [form, setForm] = React.useState({
        displayName: "",
    });

    React.useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const me = await getMe();
                if (mounted) {
                    setForm({
                        displayName: me.displayName || "",
                    });
                }
            } catch (err) {
                if (mounted) setError("Failed to load profile.");
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => (mounted = false);
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);

        // Basic Validation
        if (!form.displayName.trim()) {
            setError("Display Name cannot be empty.");
            setSaving(false);
            return;
        }

        try {
            await updateMe({
                displayName: form.displayName,
            });
            setSuccess("Profile updated successfully.");
        } catch (err) {
            console.error(err);
            setError("Failed to update profile. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-slate-500">Loading profile...</div>;
    }

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Profile Settings</h1>
                <p className="text-slate-600">Typically managed by your authentication provider, but you can override details here.</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Status Messages */}
                    {error && <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">{error}</div>}
                    {success && <div className="mb-4 rounded bg-green-50 p-3 text-sm text-green-600">{success}</div>}

                    {/* Display Name */}
                    <div>
                        <label htmlFor="displayName" className="block text-sm font-medium text-slate-700">Display Name</label>
                        <input
                            type="text"
                            id="displayName"
                            name="displayName"
                            value={form.displayName}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-slate-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border"
                            placeholder="e.g. Eddy Merckx"
                        />
                    </div>


                    {/* Actions */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
