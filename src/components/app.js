import { Fragment } from "preact";
import { useEffect, useState } from "preact/hooks";

const HELSINKI = { lat: 60.1699, lng: 24.9384 };

const WIT = [
  "Go get'em 😊",
  "We might make it through this yet 😬",
  "Blaze a trail 🔥",
  "If your sunlight is running low, ask a friend share some 🌇",
  "Got extra sunlight? Share with friends ❤️",
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
    <Fragment>
      <main>
        <h1>Sunset today (in Helsinki)</h1>
        <Sunset />
      </main>
      <footer></footer>
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
        <p>There was an error fetching the data</p>
        <p>{data.error.message}</p>
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
  return <p>That's {diffMins} minutes later than yesterday 🎉</p>;
}

function compareMinutes(dateA, dateB) {
  console.log({ dateA, dateB });
  // Clone things, to avoid accidents (don't want to mutate the arguments) :)
  let a = new Date(dateA);
  let b = new Date(dateB);

  // Pretend that date A is on the same day as date B
  a.setDate(b.getDate());

  // Then, compare the difference in milliseconds (which will be at most hours)
  const diffMs = a - b;

  // Convert that into a diff of minutes.
  // I won't bother with trying to do formatting like "1 hour 2 minutes"
  // Saying "62 minutes" is fine, and probably only happens with datetime diffs
  // (a case which I'm not sure we're handling OK anyway) :shrug:
  const diffMins = Math.floor(diffMs / 1000 / 60); // minutes

  return diffMins;
}

function getRandomWit() {
  return WIT[Math.floor(Math.random() * WIT.length)];
}

export default App;
