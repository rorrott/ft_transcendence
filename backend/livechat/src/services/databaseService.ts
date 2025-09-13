import { getDbAsync } from "../databaseServices";

export async function isBlocked(sender_id: string, receiver_id: string): Promise<boolean> {
  return new Promise(async (resolve,reject) => {
    try {
    const blocked = await getDbAsync(`SELECT * FROM blocked_users WHERE (blocker_id = ? AND blocked_id = ?) OR (blocked_id = ? AND blocker_id = ?)`, [sender_id,receiver_id,sender_id,receiver_id]);
    resolve(!!blocked)
    } catch (error) {
      reject(error)
  }
  })
}
