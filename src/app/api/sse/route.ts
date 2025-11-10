import { NextRequest, NextResponse } from "next/server";
// TODO: Implementar endpoint sse en Node.js manteniendo el JSON del PHP. 
export async function GET() { return NextResponse.json({ error: "Not Implemented: GET sse" }, { status: 501 }); }
export async function POST() { return NextResponse.json({ error: "Not Implemented: POST sse" }, { status: 501 }); }
export async function PUT() { return NextResponse.json({ error: "Not Implemented: PUT sse" }, { status: 501 }); }
export async function DELETE() { return NextResponse.json({ error: "Not Implemented: DELETE sse" }, { status: 501 }); }
