async function matchProxies() {
  const proxies = document
    .getElementById("proxies")
    .value.split("\n")
    .filter((proxy) => !!proxy)
    .map((proxy) => {
      const [inUse, port, state] = proxy.split("\t");
      return {
        inUse,
        port,
        state,
      };
    });
  console.log("proxies", proxies);

  const response = await fetch("/api/matchProxies", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(proxies),
  });

  alert(response.data);
}

async function getStatus() {
  const response = await fetch("/api/getStatus", {
    method: "POST",
  });

  alert(response.data);
}
