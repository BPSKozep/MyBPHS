export async function GET() {
    try {
        const puResponse = await fetch("https://pu.bpskozep.hu");
        if (puResponse.status === 200) {
            return new Response("Pong", { status: 200 });
        }
        return new Response("No Pong :((", { status: 400 });
    } catch (error) {
        return new Response(
            "Error fetching the URL: " + (error as Error).message,
            { status: 500 },
        );
    }
}
