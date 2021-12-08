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

  alert(await response.text());
}

async function getStatus() {
  const response = await fetch("/api/getStatus", {
    method: "POST",
  });

  let res = await response.json();
  res = res.map((proxy) => {
    return Object.assign(proxy, {
      lastSpeedTest: new Date(proxy.lastSpeedTest).toLocaleString(),
    });
  });
  document.getElementById("status").innerText = JSON.stringify(res, null, 4);
}
