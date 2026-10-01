import { requireChatGPTUser } from "./chatgpt-auth";
import Cookbook from "./cookbook";
export const dynamic = "force-dynamic";
export default async function Home() {
  await requireChatGPTUser("/");
  return <Cookbook />;
}
