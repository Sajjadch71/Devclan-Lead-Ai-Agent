import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";


function checkSecret(req: NextRequest) {
  const expected = process.env.RETELL_FUNCTION_SECRET;

  if (!expected) return true;

  return req.nextUrl.searchParams.get("key") === expected;
}


export async function POST(req: NextRequest) {

  try {

    if (!checkSecret(req)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }


    const body = await req.json();


    if (!body?.event || !body?.call) {
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      );
    }


    const { event, call } = body;


    if (event !== "call_analyzed") {
      return NextResponse.json({
        ok: true,
        skipped: event
      });
    }


    const analysis = call.call_analysis ?? {};
    const custom = analysis.custom_analysis_data ?? {};


    let contactId = null;


    const phone =
      call.direction === "inbound"
        ? call.from_number
        : call.to_number;


    if (phone) {

      const contact = await queryOne<{id:string}>(`
        insert into contacts(phone,source)
        values($1,'call')
        on conflict(phone)
        do update set updated_at=now()
        returning id
      `,
      [phone]);


      contactId = contact?.id ?? null;
    }



    const savedCall = await queryOne<any>(`

      insert into calls
      (
      contact_id,
      retell_call_id,
      direction,
      from_number,
      to_number,
      status,
      call_summary,
      call_outcome,
      raw_payload
      )

      values
      (
      $1,$2,$3,$4,$5,$6,$7,$8,$9
      )

      returning *

    `,
    [
      contactId,
      call.call_id,
      call.direction ?? "outbound",
      call.from_number ?? null,
      call.to_number ?? null,
      call.call_status ?? "ended",
      analysis.call_summary ?? null,
      custom.call_outcome ?? null,
      JSON.stringify(body)
    ]);



    let appointment = null;


    if(
      custom.call_outcome === "Booked" &&
      contactId
    ){

      const start = new Date();
      const end = new Date(
        start.getTime() + 30 * 60 * 1000
      );


      appointment = await queryOne<any>(`

        insert into appointments
        (
        contact_id,
        call_id,
        title,
        start_time,
        end_time,
        status
        )

        values
        (
        $1,$2,$3,$4,$5,$6
        )

        returning *

      `,
      [
        contactId,
        savedCall.id,
        "AI Discovery Call",
        start,
        end,
        "confirmed"
      ]);


      await query(`
        update calls
        set appointment_id=$1
        where id=$2
      `,
      [
        appointment.id,
        savedCall.id
      ]);

    }


    return NextResponse.json({
      ok:true,
      call_id:savedCall.id,
      appointment
    });


  } catch(error:any){

    console.error(
      "RETELL WEBHOOK ERROR:",
      error
    );


    return NextResponse.json(
      {
        error:error.message
      },
      {
        status:500
      }
    );

  }
}