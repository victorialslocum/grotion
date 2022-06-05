export default async function signIn(supabaseClient) {
  const { error } = await supabaseClient.auth.signIn({ provider: "notion" });
  if (error) console.log(error);
}
