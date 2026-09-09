import { NextResponse } from "next/server";
import * as configService from "@/modules/config/config.service";

export async function GET() {
  const adGroupId = await configService.getBannerAdGroupId();
  return NextResponse.json({ adGroupId });
}
