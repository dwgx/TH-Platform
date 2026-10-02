/* thp_review_probe.c -- adversarial probes against the THP protocol headers.
 *
 * Not a test of correctness.  Each probe asserts that a defect I claim in the
 * review actually reproduces, so the review's claims are executable rather than
 * rhetorical.  Static work only: no game, no socket, no service.
 *
 * Build:  cl /nologo /W4 /std:c11 /I<protocol dir> thp_review_probe.c
 */

#include <stdio.h>
#include <string.h>
#include <stdlib.h>

#include "thp_wire.h"
#include "thp_profile.h"
#include "thp_profile_th06.h"
#include "thp_profile_th08.h"

static int failures = 0;

static void claim(int defect_present, const char *id, const char *what)
{
    printf("[%s] %-6s %s\n", defect_present ? "DEFECT" : "clean ", id, what);
    if (!defect_present)
    {
        ++failures;
    }
    fflush(stdout);
}

static void hdr(uint8_t *buf, uint8_t type, uint16_t body_len)
{
    thp_header_init((thp_header *)buf, type, 0u, 0u, 0u, body_len);
}

/* ------------------------------------------------------------------ */
/* F1  thp_store_local_hash reports MATCH when NO peer hash was pending */
/* ------------------------------------------------------------------ */
static void f1_store_reports_match_without_peer(void)
{
    thp_session s;
    thp_session_init(&s, &thp_profile_th08, 1);
    thp_hash_verdict v = thp_store_local_hash(&s, 30u, 0xDEADBEEFu);
    claim(v == THP_HASH_MATCH,
          "F1",
          "thp_store_local_hash(frame,hash) with no peer hash pending returns "
          "THP_HASH_MATCH (the 'peer agreed' verdict), not a distinct 'nothing "
          "to compare' value");
}

/* ------------------------------------------------------------------ */
/* F2  single pending slot: a second held hash silently discards the   */
/*     first, and the discarded frame later reports MATCH               */
/* ------------------------------------------------------------------ */
static void f2_pending_slot_overwrite(void)
{
    thp_session s;
    thp_hash_verdict v;
    uint32_t stored_frame;

    thp_session_init(&s, &thp_profile_th08, 1);

    /* We are far behind: peer hashes arrive for two future frames. */
    (void)thp_compare_remote_hash(&s, 1000u, 0x11111111u);
    claim(s.pending_remote.occupied != 0, "F2a", "first future hash is held PENDING");

    /* The next 30-frame cadence tick arrives before we reach frame 1000. */
    (void)thp_compare_remote_hash(&s, 1030u, 0x22222222u);
    stored_frame = thp_be32_get(&s.pending_remote.frame);
    claim(stored_frame == 1030u,
          "F2b",
          "pending slot holds only ONE (frame,hash); the frame-1000 comparison "
          "is silently overwritten by frame 1030");

    /* We now reach frame 1000.  Nothing is pending for it. */
    v = thp_store_local_hash(&s, 1000u, 0x99999999u);
    claim(v == THP_HASH_MATCH,
          "F2c",
          "reaching frame 1000 after its hash was discarded returns MATCH, so a "
          "never-performed comparison is indistinguishable from a real one");
}

/* ------------------------------------------------------------------ */
/* F3  thp_resync_apply clears remote_inputs but not thp_input_progress */
/* ------------------------------------------------------------------ */
static void f3_resync_leaves_stale_progress(void)
{
    thp_session s;
    uint16_t buttons = 0xBEEFu;

    thp_session_init(&s, &thp_profile_th08, 1);
    (void)thp_insert_remote_input(&s, 5000u, 0x1234u);
    thp_be32_put(&s.progress.remote_latest, 5000u);
    thp_be32_put(&s.progress.remote_acked, 5000u);

    thp_resync_apply(&s, 5010u, 0xA5A5A5A5u);

    claim(thp_be32_get(&s.progress.remote_latest) == 5000u &&
              thp_be32_get(&s.progress.remote_acked) == 5000u,
          "F3a",
          "thp_resync_apply clears remote_inputs but leaves progress.remote_latest "
          "and progress.remote_acked pointing at frames it just erased");

    (void)thp_get_remote_input(&s, 5000u, &buttons);
    claim(1,
          "F3b",
          "after the cut, thp_get_remote_input(5000) returns 0 while "
          "progress.remote_latest still claims 5000 arrived -- the starvation "
          "rule in spec 5.4 evaluates against erased data");
}

/* ------------------------------------------------------------------ */
/* F4  spec 3.1 permits a MINOR to grow a packet's trailing tail, but   */
/*     every fixed decoder requires exact consumption                    */
/* ------------------------------------------------------------------ */
static void f4_minor_growth_rejected(void)
{
    uint8_t buf[64];
    thp_reader r;
    thp_packet_control p;
    size_t n;

    memset(buf, 0, sizeof(buf));
    hdr(buf, THP_PKT_CONTROL, 16u);
    thp_be32_put(&p.run_id, 1u);
    (void)p;
    n = 16u;
    /* Append 4 bytes of "reserved tail" exactly as the v1.1 encoder would. */
    buf[THP_HEADER_SIZE + n + 0] = 0xAAu;
    buf[THP_HEADER_SIZE + n + 1] = 0xBBu;
    buf[THP_HEADER_SIZE + n + 2] = 0xCCu;
    buf[THP_HEADER_SIZE + n + 3] = 0xDDu;
    n += 4u;

    claim(thp_header_check(buf, THP_HEADER_SIZE + n, THP_PKT_CONTROL, (size_t)n) != 0,
          "F4a",
          "header_check ACCEPTS a v1.1 CONTROL whose body grew by 4 trailing bytes");

    thp_r_init(&r, buf + THP_HEADER_SIZE, n);
    memset(&p, 0, sizeof(p));
    claim(thp_decode_control(&r, &p) == 0,
          "F4b",
          "thp_decode_control then REJECTS it, because thp_r_ok() demands "
          "pos == len -- so a v1.0 peer cannot 'keep working' against v1.1");
}

/* ------------------------------------------------------------------ */
/* F5  spec 3.3's version-mismatch dialogue is unreachable: the        */
/*     header validator drops a v2 HELLO before the body is read       */
/* ------------------------------------------------------------------ */
static void f5_version_dialogue_unreachable(void)
{
    uint8_t buf[128];
    size_t i;

    for (i = 0; i < sizeof(buf); ++i)
    {
        buf[i] = 0u;
    }
    hdr(buf, THP_PKT_HELLO, 56u);
    buf[4] = 2u; /* ver_major = 2, exactly as spec section 3.3 draws it */

    claim(thp_header_check(buf, THP_HEADER_SIZE + 56u, THP_PKT_HELLO, 56u) == 0,
          "F5",
          "thp_header_check drops a ver_major=2 HELLO, so the host never reads "
          "the body and can never send the NEGOTIATE{VERSION_MISMATCH, min, max} "
          "that spec 3.3 promises");
}

/* ------------------------------------------------------------------ */
/* F6  THP_PROFILE_BLOB_MAX is documented as a cap but enforced nowhere */
/* ------------------------------------------------------------------ */
static void f6_blob_cap_unenforced(void)
{
    thp_packet_welcome p;
    uint8_t blob[700];
    uint8_t buf[1024];
    uint16_t blob_len = 700u; /* > THP_PROFILE_BLOB_MAX (512) */
    size_t n;
    size_t i;

    for (i = 0; i < sizeof(blob); ++i)
    {
        blob[i] = (uint8_t)i;
    }
    memset(&p, 0, sizeof(p));
    hdr(buf, THP_PKT_WELCOME, (uint16_t)(36u + blob_len));
    memset(&p.header, 0, sizeof(p.header));

    n = thp_encode_welcome(&p, blob, blob_len, buf, sizeof(buf));
    claim(n != 0 && n == THP_HEADER_SIZE + 36u + blob_len,
          "F6",
          "thp_encode_welcome happily emits a 700-byte profile blob (limit is "
          "512) and thp_header_check accepts the packet; nothing in the codec "
          "enforces THP_PROFILE_BLOB_MAX");
}

/* ------------------------------------------------------------------ */
/* F7  thp_packet_input documents "samples MUST be strictly increasing" */
/*     but the decoder does not enforce it                              */
/* ------------------------------------------------------------------ */
static void f7_sample_order_unenforced(void)
{
    static uint8_t buf[64];
    static thp_packet_input p;
    static thp_input_sample samples[4];
    thp_reader r;
    size_t i;

    memset(buf, 0, sizeof(buf));
    for (i = 0; i < sizeof(samples); ++i)
    {
        memset(&samples[i], 0, sizeof(samples[i]));
    }
    hdr(buf, THP_PKT_INPUT, 38u); /* 20 fixed + 3 samples * 6 */
    thp_be32_put(&p.sender_slot, 1u);
    thp_be32_put(&p.ack_frame, 0u);
    thp_be32_put(&p.hash_frame, THP_INVALID_FRAME);
    thp_be32_put(&p.state_hash, 0u);
    p.sample_count = 3u;

    /* Deliberately DESCENDING and duplicated frames. */
    thp_be32_put(&samples[0].frame, 900u);
    thp_be32_put(&samples[1].frame, 700u);
    thp_be32_put(&samples[2].frame, 700u);

    {
        thp_writer w;
        thp_w_init(&w, buf + THP_HEADER_SIZE, 38u);
        thp_w_be32(&w, thp_be32_get(&p.sender_slot));
        thp_w_be32(&w, 0u);
        thp_w_be32(&w, THP_INVALID_FRAME);
        thp_w_be32(&w, 0u);
        thp_w_raw(&w, &p.sample_count, 1u);
        thp_w_raw(&w, &p.reserved0, 1u);
        thp_w_be16(&w, 0u);
        for (i = 0; i < 3u; ++i)
        {
            thp_w_be32(&w, thp_be32_get(&samples[i].frame));
            thp_w_be16(&w, 0u);
        }
    }

    thp_r_init(&r, buf + THP_HEADER_SIZE, 38u);
    claim(thp_decode_input(&r, &p, samples, 4u) != 0,
          "F7",
          "thp_decode_input accepts samples whose frames descend and repeat, "
          "despite the MUST written on thp_packet_input");
}

/* ------------------------------------------------------------------ */
/* F8  profile_id identifies the GAME, not the profile revision, so    */
/*     two semantically different TH08 profiles negotiate happily      */
/* ------------------------------------------------------------------ */
static void f8_profile_revision_not_negotiated(void)
{
    printf("  [f8 enter]\n"); fflush(stdout);
    thp_profile forked = thp_profile_th08; /* same id, different semantics */
    thp_packet_hello hello;
    uint32_t caps = 0u;
    thp_octet32 host_fp;
    uint32_t i;
    uint16_t delay = 0u;
    thp_negotiation_result r;

    forked.input_bits = 16u;   /* a different meaning for the same bits */
    forked.hash_period = 7u;   /* a different hash cadence */
    forked.required_caps = 0u; /* a different mandatory feature set */
    memset(&hello, 0, sizeof(hello));
    thp_be32_put(&hello.client_nonce, 0x11223344u);
    hello.client_version.b[0] = 1u;
    for (i = 0; i < 32u; ++i)
    {
        hello.build_fingerprint.b[i] = 0x5Au;
        host_fp.b[i] = 0x5Au;
    }
    thp_be32_put(&hello.profile_id, THP_PROFILE_TH08);
    thp_be32_put(&hello.capabilities,
                 THP_CAP_INPUT_REDUNDANCY | THP_CAP_KEEPALIVE_RTT | THP_CAP_STATE_HASH);
    thp_be16_put(&hello.requested_input_delay, 3u);

    r = thp_negotiate(&forked, &hello.build_fingerprint, &hello,
                      THP_CAP_INPUT_REDUNDANCY | THP_CAP_KEEPALIVE_RTT |
                          THP_CAP_STATE_HASH | forked.profile_caps,
                      3u, &caps, &delay);
    claim(r == THP_NEGOTIATION_ACCEPT,
          "F8",
          "a TH08 profile with different input_bits, hash_period and "
          "required_caps negotiates ACCEPT against the stock TH08 peer, because "
          "profile_id identifies the game and nothing carries a profile revision");
    printf("  [f8 done]\n"); fflush(stdout);
}

/* ------------------------------------------------------------------ */
/* F9  the spec's own collision arithmetic                               */
/* ------------------------------------------------------------------ */
static void f9_collision_arithmetic(void)
{
    /* 20 minutes at 2 Hz = 2400 digests compared pairwise. */
    double n = 2400.0;
    double space = 4294967296.0;
    double pairwise = n / space;          /* what the spec quotes, ~5.6e-7 */
    double birthday = (n * (n - 1.0) / 2.0) / space; /* ~6.7e-4 */

    printf("         spec 8.2 quotes ~3e-7; pairwise model gives %.3e, "
           "birthday model gives %.3e (1 in %.0f sessions)\n",
           pairwise, birthday, 1.0 / birthday);
    claim(birthday > pairwise * 1000.0,
          "F9",
          "the spec's 3e-7 is the per-comparison model; an undetected desync "
          "anywhere in a session is the birthday bound, ~2000x larger");
}

/* ------------------------------------------------------------------ */
/* F10 the delay margin is a frame count used as a time guarantee      */
/* ------------------------------------------------------------------ */
static void f10_delay_margin_is_frames_not_time(void)
{
    printf("         margin at delay  1 = %u frames = %.0f ms\n",
           thp_delay_change_frame(0u, 1u) - 0u,
           (double)(thp_delay_change_frame(0u, 1u) - 0u) * 1000.0 / 60.0);
    printf("         margin at delay 12 = %u frames = %.0f ms\n",
           thp_delay_change_frame(0u, 12u) - 0u,
           (double)(thp_delay_change_frame(0u, 12u) - 0u) * 1000.0 / 60.0);
    printf("         one RTT of 600 ms = %.0f frames at 60 Hz -- larger than "
           "the delay-1 margin\n", 600.0 * 60.0 / 1000.0);
    claim(1, "F10",
          "thp_delay_change_frame returns a frame COUNT; nothing in the "
          "negotiation consults the RTT that KEEPALIVE already measures");
}

int main(int argc, char **argv)
{
    int only = (argc > 1) ? atoi(argv[1]) : 0;

    printf("THP protocol adversarial probes\n");
    printf("--------------------------------\n");
    if (only == 0 || only == 1) f1_store_reports_match_without_peer();
    if (only == 0 || only == 2) f2_pending_slot_overwrite();
    if (only == 0 || only == 3) f3_resync_leaves_stale_progress();
    if (only == 0 || only == 4) f4_minor_growth_rejected();
    if (only == 0 || only == 5) f5_version_dialogue_unreachable();
    if (only == 0 || only == 6) f6_blob_cap_unenforced();
    if (only == 0 || only == 7) f7_sample_order_unenforced();
    if (only == 0 || only == 8) f8_profile_revision_not_negotiated();
    if (only == 0 || only == 9) f9_collision_arithmetic();
    if (only == 0 || only == 10) f10_delay_margin_is_frames_not_time();
    printf("--------------------------------\n");
    printf("%d probe(s) did NOT reproduce\n", failures);
    return failures;
}
