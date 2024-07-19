import { SetTransport } from "@mercuryworkshop/bare-mux";

// will register /sw.js and setup bare mux
// reloads the page to activate the sw.js if it wasn't registered
export async function setupServiceWorker() {
  // add your network hostname here or whatever
  // this is any page that does NOT have http: but can register a serviceworker
  const isDev = ["localhost", "127.0.0.1"].includes(location.hostname);

  if (location.protocol !== "https:" && !isDev)
    throw new Error("HTTPS must be enabled to use Ultraviolet.");

  // this provides a HUGE performance improvement
  if (!window.crossOriginIsolated && !isDev)
    console.warn(
      "crossOriginIsolated should be enabled to increase performance."
    );

  if (!navigator.serviceWorker) {
    if (location.protocol === "https:") {
      alert("Please disable incognito mode!");
      throw new Error("Incognito was enabled.");
    } else throw new Error("Your browser doesn't support service workers.");
  }

  const reg = await navigator.serviceWorker.getRegistration();
  if (reg) {
    await navigator.serviceWorker.ready;
    console.log("Service worker registered");
  } else {
    await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    console.log("Service worker registered");
    console.log("Reloading the page to activate it.");
    setTimeout(() => location.reload(), 100);
    return;
  }

  const endpoint = getWispEndpoint();
  console.log("Using wisp at", endpoint);
  SetTransport("EpxMod.EpoxyClient", {
    wisp: endpoint,
  });
  console.log(SetTransport.toString());
  return new Promise((resolve) => setTimeout(resolve, 1e3));
}

// get the Holy Unblocker wisp endpoint
export function getWispEndpoint() {
  // HTML element inserted by astro
  // - it contains the [data-wispServer] attribute which tells the client what wisp server to use
  // - this value is directly from appConfig.
  const ele = document.getElementById("wispServerThing")!;
  const separateWispServer = ele.getAttribute("data-wispServer")!;

  // defaults to wisp on /api/wisp which is hosted by the Holy Unblocker runtime
  // see: ./config/runtime.js
  // and see separateWispServer in ./config/config.js
  const wispAPI = formatURL(separateWispServer);

  return wispAPI;
}

// Replaces %{} crap with their actual values
// eg env: %{ws}%{host}/api/wisp
function formatURL(env: string): string {
  const { host, hostname, protocol } = globalThis.location;
  const vars: Record<string, string> = {
    host,
    hostname,
    protocol,
    ws: protocol === "https:" ? "wss:" : "ws:",
  };
  for (const key in vars) env = env.replaceAll("%{" + key + "}", vars[key]);
  // console.log(env);
  return env;
}