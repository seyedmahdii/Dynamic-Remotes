import moment from "moment";

export default function Widget() {
  return (
    <div
      style={{
        borderRadius: "4px",
        padding: "2em",
        backgroundColor: "red",
        color: "white",
      }}
      data-e2e="APP_2__WIDGET"
    >
      <h2>App 2 Widget</h2>
      <p>
        Moment.js is shared from the host - no duplicate downloads! <br />{" "}
        {moment().format("MMMM Do YYYY, h:mm:ss a")}
      </p>
    </div>
  );
}
