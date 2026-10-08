import mongooseConnect from "@/clients/mongoose";
import { env } from "@/env/server";
import LaptopLogin from "@/models/LaptopLogin.model";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedAuth = `Bearer ${env.LAPTOP_SECRET}`;

  if (!authHeader || authHeader !== expectedAuth) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      user: string;
      number: number;
      reason?: string;
    };

    const { user, number, reason } = body;

    if (!user || typeof user !== "string") {
      return new Response(JSON.stringify({ error: "User field is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (number === undefined || typeof number !== "number") {
      return new Response(
        JSON.stringify({
          error: "Number field is required and must be a number",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (reason !== undefined && reason !== null && typeof reason !== "string") {
      return new Response(
        JSON.stringify({
          error: "Reason must be a string",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    await mongooseConnect();

    await LaptopLogin.create({
      date: new Date(),
      user: user,
      number: number,
      ...(typeof reason === "string" && reason.trim()
        ? { reason: reason.trim() }
        : {}),
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Laptop login saved successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Failed to save laptop login:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to save login",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
