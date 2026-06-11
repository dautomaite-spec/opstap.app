import { fetchUsers } from './actions'
import AdminPanel from './AdminPanel'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const users = await fetchUsers()
  return <AdminPanel initialUsers={users} />
}
