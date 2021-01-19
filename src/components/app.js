import { Router } from "preact-router";
import { useEffect, useState } from "preact/hooks";

const HELSINKI = { lat: 60.1699, lng: 24.9384 };

const WIT = [
  "Go get'em 😊",
  "We might make it through this yet 😬",
  "Blaze a trail 🔥",
  "Make your own sunset (or ask to borrow some) 🌇",
];

async function getSunriseSunsetData({ lat, lng, date }) {
  const baseURL = new URL("https://api.sunrise-sunset.org/json");
  baseURL.searchParams.set("lat", lat);
  baseURL.searchParams.set("lng", lng);
  baseURL.searchParams.set("date", date);
  baseURL.searchParams.set("formatted", 0);

  const res = await fetch(baseURL).then((res) => res.json());
  return res;
}

const App = () => {
  return (
    <main>
      <h1>Sunset today (in Helsinki)</h1>
      <Sunset />
    </main>
  );
};

function Sunset() {
  const [data, setData] = useState({ type: "loading" });

  useEffect(() => {
    getSunriseSunsetData({ ...HELSINKI, date: "today" })
      .then((res) => setData({ type: "success", data: res }))
      .catch((error) => {
        console.error(error);
        setData({ type: "error", error });
      });
  }, []);

  if (data.type === "loading") {
    return <div>Loading...</div>;
  }
  if (data.type === "error") {
    return (
      <div>
        <p>There was an error fetching the data</p>
        <p>{data.error.message}</p>
      </div>
    );
  }
  const date = new Date(Date.parse(data.data.results.sunset));
  return (
    <div>
      <p>
        <time dateTime={date.toISOString()}>
          {date.toLocaleString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      </p>
      <p class="wit">{getRandomWit()}</p>
    </div>
  );
}

function getRandomWit() {
  return WIT[Math.floor(Math.random() * WIT.length)];
}

export default App;
