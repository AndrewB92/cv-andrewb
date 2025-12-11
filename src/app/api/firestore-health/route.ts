import { NextResponse } from "next/server";
import { collection, getDocs, limit, query } from "firebase/firestore";

import { db } from "@/lib/firebase";

export async function GET() {
  try {
    const healthCollection = collection(db, "__healthcheck");
    const snapshot = await getDocs(query(healthCollection, limit(1)));

    return NextResponse.json({
      ok: true,
      checkedAt: new Date().toISOString(),
      collection: healthCollection.path,
      sampleCount: snapshot.size,
    });
  } catch (error) {
    console.error("Firestore health check failed:", error);

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Unknown Firestore error",
      },
      { status: 500 },
    );
  }
}
