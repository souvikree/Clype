export function getIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
  ];

  const user = process.env.NEXT_PUBLIC_TURN_USERNAME;
  const cred = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

  if (user && cred) {
    const urls: string[] = [];

    if (process.env.NEXT_PUBLIC_TURN_URL_UDP) {
      urls.push(process.env.NEXT_PUBLIC_TURN_URL_UDP);
    }
    if (process.env.NEXT_PUBLIC_TURN_URL_TCP) {
      urls.push(process.env.NEXT_PUBLIC_TURN_URL_TCP);
    }

    if (urls.length > 0) {
      servers.push({
        urls,
        username: user,
        credential: cred,
      });
    }
  }

  return servers;
}
