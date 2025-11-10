import { NextRequest, NextResponse } from "next/server";
// TODO: Implementar endpoint cors en Node.js manteniendo el JSON del PHP. 
export async function GET() { return NextResponse.json({ error: "Not Implemented: GET cors" }, { status: 501 }); }
export async function POST() { return NextResponse.json({ error: "Not Implemented: POST cors" }, { status: 501 }); }
export async function PUT() { return NextResponse.json({ error: "Not Implemented: PUT cors" }, { status: 501 }); }
export async function DELETE() { return NextResponse.json({ error: "Not Implemented: DELETE cors" }, { status: 501 }); }
