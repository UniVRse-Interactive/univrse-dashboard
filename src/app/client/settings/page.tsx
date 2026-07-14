import { ProfileSettingsForm } from "@/components/client/ProfileSettingsForm"
import { fetchLocalApi } from "@/lib/server-api"

interface ProfileResponse {
  ok: boolean
  data: {
    email: string
    display_name?: string | null
    company_name?: string | null
    role?: string | null
    phone_number?: string | null
  }
}

export default async function ClientSettingsPage() {
  const profileRes = await fetchLocalApi<ProfileResponse>("/api/client/profile")
  const profile = profileRes.json?.data

  if (!profile) {
    return <div className="text-sm text-zinc-500">Unable to load your profile.</div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-zinc-400">Manage your account, security, and preferences.</p>
      </div>
      <ProfileSettingsForm
        email={profile.email}
        displayName={profile.display_name}
        companyName={profile.company_name}
        role={profile.role}
        phoneNumber={profile.phone_number}
      />
    </div>
  )
}
