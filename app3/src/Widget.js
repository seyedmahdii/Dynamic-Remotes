import moment from "moment";

export default function Widget() {
  return (
    <div
      style={{
        borderRadius: "4px",
        padding: "2em",
        backgroundColor: "purple",
        color: "white",
      }}
      data-e2e="APP_3__WIDGET"
    >
      <h2>App 3 Widget</h2>
      <p>
        Using shared <strong>moment.js</strong> from the host for date
        formatting
      </p>
      <p>{moment().format("MMMM Do YYYY, h:mm:ss a")}</p>
    </div>
  );
}
