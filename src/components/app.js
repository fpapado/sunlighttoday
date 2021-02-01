import { Fragment } from "preact";
import { useEffect, useState } from "preact/hooks";

const HELSINKI = { lat: 60.1699, lng: 24.9384 };

// Wait 15s for a response, then give up
const TIMEOUT = 15000;

const WIT = [
  "Go get'em 😊",
  "We might make it through this yet 😬",
  "Blaze a trail 🔥",
  "If your sunlight is running low, ask a friend to share some 🌇",
  "Got extra sunlight? Share with friends ❤️",
  "Even with cloud cover, longer days are a better chance at seeing the sun 🌞",
  "I am running out of ideas for these aphorisms 🤷🏼",
];

async function getSunriseSunsetData({ lat, lng, date }) {
  const baseURL = new URL("https://api.sunrise-sunset.org/json");
  baseURL.searchParams.set("lat", lat);
  baseURL.searchParams.set("lng", lng);
  baseURL.searchParams.set("date", date);
  baseURL.searchParams.set("formatted", 0);

  const res = await withTimeout(
    ({ signal }) => fetch(baseURL, { signal }),
    TIMEOUT
  );

  return res.json();
}

async function withTimeout(cb, ms) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);

  try {
    return await cb({ signal: controller.signal });
  } finally {
    // Not sure if we even need to clean up the timer, but ok
    clearTimeout(timeoutId);
  }
}

const App = () => {
  return (
    <Fragment>
      <main>
        <h1>Sunset today (in Helsinki)</h1>
        <Sunset />
      </main>
      <footer>
        <p>
          Made with 😈 by{" "}
          <a href="https://fotis.xyz">Fotis Papadogeorgopoulos</a>, using the{" "}
          <a href="https://sunrise-sunset.org/api">Sunrise Sunset API</a>.{" "}
          <a href="https://github.com/fpapado/sunlighttoday">
            Source on GitHub
          </a>
          .
        </p>
      </footer>
    </Fragment>
  );
};

function Sunset() {
  const [today, setToday] = useState({ type: "loading" });
  const [yesterday, setYesterday] = useState({ type: "loading" });

  useEffect(() => {
    getSunriseSunsetData({ ...HELSINKI, date: "today" })
      .then((res) => setToday({ type: "success", data: res }))
      .catch((error) => {
        console.error(error);
        setToday({ type: "error", error });
      });
  }, []);

  useEffect(() => {
    getSunriseSunsetData({ ...HELSINKI, date: "yesterday" })
      .then((res) => setYesterday({ type: "success", data: res }))
      .catch((error) => {
        console.error(error);
        setYesterday({ type: "error", error });
      });
  }, []);

  if (today.type === "loading" || yesterday.type === "loading") {
    return <div>Loading...</div>;
  }

  if (today.type === "error") {
    return (
      <div>
        {today.error.name === "AbortError" ? (
          <p>We could not fetch the data in time.</p>
        ) : (
          <p>There was an error fetching the data.</p>
        )}
      </div>
    );
  }

  const sunsetToday = new Date(Date.parse(today.data.results.sunset));

  return (
    <div>
      <p>
        <time dateTime={sunsetToday.toISOString()}>
          {sunsetToday.toLocaleString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      </p>
      {/* Do not block on yesterday error; just no comparison */}
      {yesterday.type === "success" ? (
        <Comparison
          today={sunsetToday}
          yesterday={new Date(Date.parse(yesterday.data.results.sunset))}
        />
      ) : null}
      <p class="wit">{getRandomWit()}</p>
    </div>
  );
}

function Comparison({ today, yesterday }) {
  const diffMins = compareMinutes(today, yesterday);
  console.log(today, yesterday, diffMins);
  const sign = Math.sign(diffMins);

  if (sign === 0) {
    // Possibly a rounding error, or small change
    return <p>That's about the same as yesterday.</p>;
  }
  if (sign === -1) {
    // Do not give the numbers here, they're sad
    return <p>That's earlier than yesterday :/</p>;
  }
  // Here we party
  // Show one decimal, for extra sunlight
  return <p>That's {diffMins.toFixed(1)} minutes later than yesterday 🎉</p>;
}

function compareMinutes(dateA, dateB) {
  // Clone dates to avoid mutating the arguments
  let a = new Date(dateA);
  let b = new Date(dateB);

  // Pretend that date A is on the same day as date B (so that we only compare milliseconds on the order of hours)
  // NOTE: If you set these the other way around, the date rolls over further :/
  a.setMonth(b.getMonth());
  a.setDate(b.getDate());

  // Then, compare the difference in milliseconds (which will be at most hours)
  const diffMs = a - b;

  // Convert that into a diff of minutes.
  // I won't bother with trying to do formatting like "1 hour 2 minutes"
  // Saying "62 minutes" is fine, and probably only happens with datetime diffs
  // (a case which I'm not sure we're handling OK anyway) :shrug:
  const diffMins = diffMs / 1000 / 60; // minutes

  return diffMins;
}

function getRandomWit() {
  return WIT[Math.floor(Math.random() * WIT.length)];
}

export default App;
