import autocannon from "autocannon"

const run = async () => {
  const instance = autocannon(
    {
      url: "http://localhost:8787/user",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: "test" }),
      duration: 10, // 秒
    },
    (err, result) => {
      if (err) {
        console.error("Error:", err)
        return
      }
      console.log("Benchmark completed:", result)
    }
  )

  autocannon.track(instance, { renderProgressBar: true })
}

run()