import { Polar } from "@polar-sh/sdk";

const accessToken = process.env.POLAR_ACCESS_TOKEN;

if (!accessToken) {
    if (process.env.NODE_ENV === "production") {
        throw new Error("POLAR_ACCESS_TOKEN is required in production");
    } else {
        console.error("POLAR_ACCESS_TOKEN is missing. Polar features will not work.");
    }
}

const polarEnv = process.env.POLAR_ENV;

if (polarEnv && polarEnv !== "sandbox" && polarEnv !== "production") {
    throw new Error(`Invalid POLAR_ENV: ${polarEnv}. Must be "sandbox" or "production".`);
}

export const polar = new Polar({
    accessToken: accessToken || "",
    server: (polarEnv as "sandbox" | "production") || (process.env.NODE_ENV === "development" ? "sandbox" : "production"),
});
