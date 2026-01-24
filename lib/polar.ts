import { Polar } from "@polar-sh/sdk";

const accessToken = process.env.POLAR_ACCESS_TOKEN;

if (!accessToken) {
    if (process.env.NODE_ENV === "production") {
        throw new Error("POLAR_ACCESS_TOKEN is required in production");
    } else {
        console.error("POLAR_ACCESS_TOKEN is missing. Polar features will not work.");
    }
}

export const polar = new Polar({
    accessToken: accessToken || "",
    server: (process.env.POLAR_ENV as "sandbox" | "production") || (process.env.NODE_ENV === "development" ? "sandbox" : "production"),
});
