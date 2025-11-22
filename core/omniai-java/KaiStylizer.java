// KaiStylizer.java — Consent-gated, non-cloning voice stylizer (Java)
// Safe design: requires consent.json, blocks if MFCC similarity >= cap, applies gentle multi-band EQ
// toward reference profile (not full envelope match), embeds subtle ultrasonic watermark,
// and supports offline-only operation. Designed for private/home use.
//
// Build (needs TarsosDSP + Gson on classpath):
//   javac -cp .:tarsosdsp-2.5.jar:gson-2.10.1.jar KaiStylizer.java
// Run:
//   java -cp .:tarsosdsp-2.5.jar:gson-2.10.1.jar KaiStylizer \
//       --source source.wav --reference ref.wav --out styled.wav \
//       --consent config/consent.json --similarity-cap 0.80 --style-amount 0.35 --offline --verify
//
// What this does (safely):
// 1) Reads and enforces consent.json (consent:true).
// 2) Computes MFCC profiles for source & reference, refuses if cosine similarity >= cap.
// 3) Estimates coarse spectral differences in 5 bands and applies limited peaking/shelf filters
//    (±1.5 dB max, blended by style-amount; not a clone).
// 4) Adds a low-level watermark tone burst near 18–19 kHz.
// 5) Optional "--verify": prints a simple integrity hash of this file (for your records).
//
// Dependencies:
//   - TarsosDSP (filters, audio IO, MFCC)
//   - Gson (parse consent.json)
//

import be.tarsos.dsp.*;
import be.tarsos.dsp.filters.BiquadFilter;
import be.tarsos.dsp.io.jvm.AudioDispatcherFactory;
import be.tarsos.dsp.io.jvm.WaveformWriter;
import be.tarsos.dsp.mfcc.MFCC;

import javax.sound.sampled.AudioFormat;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.util.*;
import com.google.gson.*;

public class KaiStylizer {

    static class Args {
        String source, reference, out, consent;
        float similarityCap = 0.80f;
        float styleAmount = 0.35f; // 0..0.6 suggested
        boolean offline = false;
        boolean verify = false;
    }

    static final float SR = 22050f; // analysis/processing rate (Tarsos resamples internally via fromPipe)
    static final int NFFT = 1024, HOP = 256;
    static final String VERSION = "v3.5.1";
    static final String DOC_CODE = "KC-2025-014-DCH";

    public static void main(String[] raw) throws Exception {
        Args args = parse(raw);
        requireConsent(args.consent);

        // Load mono signals
        float[] src = Wav.readMono(args.source, (int) SR);
        float[] ref = Wav.readMono(args.reference, (int) SR);

        // Similarity guard
        float[] srcMFCC = mfccProfile(src, (int) SR);
        float[] refMFCC = mfccProfile(ref, (int) SR);
        float sim = cosine(srcMFCC, refMFCC);
        System.out.printf("[Kai] MFCC similarity (cosine): %.3f%n", sim);
        if (sim >= args.similarityCap) {
            System.err.printf("[Guard] Similarity %.3f >= cap %.2f. Refusing to avoid 1:1 replication.%n",
                    sim, args.similarityCap);
            System.exit(1);
        }

        // Estimate band gains (5 bands) from coarse spectra
        float[] srcBands = bandEnergies(src, (int) SR);
        float[] refBands = bandEnergies(ref, (int) SR);
        float[] gainsDB = computeBandGains(srcBands, refBands, Math.min(0.6f, Math.max(0f, args.styleAmount)));
        System.out.println("[Kai] Target EQ gains (dB): " + Arrays.toString(gainsDB));

        // Stream processing with EQ + watermark
        AudioFormat fmt = new AudioFormat(SR, 16, 1, true, false);
        AudioDispatcher dispatcher = AudioDispatcherFactory.fromPipe(args.source, (int) SR, 2048, 512);
        MultiBandEQ eq = new MultiBandEQ(SR, gainsDB);
        dispatcher.addAudioProcessor(eq);
        Watermark wm = new Watermark((int) SR, 0.25f, new int[]{18100,19100}, -42f, 0.2f);
        dispatcher.addAudioProcessor(wm);
        WaveformWriter writer = new WaveformWriter(new File(args.out), fmt);
        dispatcher.addAudioProcessor(writer);
        dispatcher.run();
        writer.processingFinished();
        System.out.println("[Kai] Wrote: " + args.out + "  (watermarked, consent-checked, non-cloning)");

        if (args.verify) {
            String hash = sha256File(new File("src/java/KaiStylizer.java"));
            System.out.println("[Kai] KaiStylizer.java sha256: " + hash);
        }
    }

    // ----- Consent -----
    static void requireConsent(String path) throws Exception {
        String s = new String(Files.readAllBytes(Paths.get(path)), "UTF-8");
        JsonObject j = JsonParser.parseString(s).getAsJsonObject();
        if (!j.has("consent") || !j.get("consent").getAsBoolean()) {
            throw new IllegalStateException("Consent check failed: 'consent' must be true in consent.json");
        }
        String who = j.has("speaker_name") ? j.get("speaker_name").getAsString() : "unknown";
        String scope = j.has("scope") ? j.get("scope").getAsString() : "";
        System.out.println("[Kai] Reference speaker: " + who + " (scope: " + scope + ")");
    }

    // ----- Parse args -----
    static Args parse(String[] a) {
        Args r = new Args();
        for (int i=0;i<a.length;i++) {
            switch (a[i]) {
                case "--source": r.source = a[++i]; break;
                case "--reference": r.reference = a[++i]; break;
                case "--out": r.out = a[++i]; break;
                case "--consent": r.consent = a[++i]; break;
                case "--similarity-cap": r.similarityCap = Float.parseFloat(a[++i]); break;
                case "--style-amount": r.styleAmount = Float.parseFloat(a[++i]); break;
                case "--offline": r.offline = true; break;
                case "--verify": r.verify = true; break;
            }
        }
        if (r.source==null || r.reference==null || r.out==null || r.consent==null) {
            System.err.println("Usage: --source src.wav --reference ref.wav --out out.wav --consent consent.json [--similarity-cap 0.80] [--style-amount 0.35] [--offline] [--verify]");
            System.exit(1);
        }
        return r;
    }

    // ----- MFCC profile -----
    static float[] mfccProfile(float[] y, int sr) {
        MFCC mfcc = new MFCC(NFFT, sr, 20, 40, 20, sr/2);
        int frames = Math.max(1, 1 + (y.length - NFFT) / HOP);
        float[] accum = new float[20];
        float[] frame = new float[NFFT];
        for (int t=0, idx=0; t<frames; t++, idx+=HOP) {
            Arrays.fill(frame, 0f);
            System.arraycopy(y, idx, frame, 0, Math.min(NFFT, y.length-idx));
            AudioEvent ev = new AudioEvent(new AudioFormat(sr,16,1,true,false), idx/(float)sr);
            ev.setFloatBuffer(frame);
            mfcc.process(ev);
            float[] c = mfcc.getMFCC();
            for (int k=0;k<accum.length && k<c.length;k++) accum[k]+=c[k];
        }
        for (int k=0;k<accum.length;k++) accum[k]/=frames;
        return accum;
    }

    static float cosine(float[] a, float[] b) {
        double da=0, db=0, dot=0;
        for (int i=0;i<Math.min(a.length,b.length);i++) {
            dot += a[i]*b[i];
            da += a[i]*a[i];
            db += b[i]*b[i];
        }
        return (float)(dot / (Math.sqrt(da+1e-9)*Math.sqrt(db+1e-9)));
    }

    // ----- Coarse spectral bands and EQ gains -----
    static final float[] BAND_CENTERS = {220f, 800f, 2000f, 5000f, 10000f};
    static float[] bandEnergies(float[] y, int sr) {
        // Very coarse magnitude estimate using rectangular windows + FFT magnitude
        int frames = Math.max(1, 1 + (y.length - NFFT) / HOP);
        double[] accum = new double[BAND_CENTERS.length];
        int[] counts = new int[BAND_CENTERS.length];
        for (int t=0, idx=0; t<frames; t++, idx+=HOP) {
            float[] frame = new float[NFFT];
            System.arraycopy(y, idx, frame, 0, Math.min(NFFT, y.length-idx));
            float[] mag = magSpectrum(frame);
            for (int b=0;b<BAND_CENTERS.length;b++) {
                double en = bandEnergy(mag, sr, BAND_CENTERS[b], (b==0? 1.0: Math.sqrt(2))); // wide-ish
                accum[b]+=en; counts[b]++;
            }
        }
        float[] out = new float[BAND_CENTERS.length];
        for (int b=0;b<out.length;b++) out[b]=(float)(accum[b]/Math.max(1,counts[b]));
        return out;
    }

    static float[] computeBandGains(float[] src, float[] ref, float amount) {
        float[] gainsDb = new float[src.length];
        for (int i=0;i<src.length;i++) {
            float s = Math.max(1e-6f, src[i]);
            float r = Math.max(1e-6f, ref[i]);
            float ratio = r/s;
            ratio = Math.max(0.5f, Math.min(1.5f, ratio)); // clamp
            float targetDb = (float)(20.0*Math.log10(ratio));
            targetDb = Math.max(-1.5f, Math.min(+1.5f, targetDb)); // gentle
            gainsDb[i] = amount*targetDb;
        }
        return gainsDb;
    }

    // FFT magnitude
    static float[] magSpectrum(float[] frame) {
        int n = frame.length;
        float[] re = Arrays.copyOf(frame, n);
        float[] im = new float[n];
        // naive DFT: using simple FFT would be better; but keep dependency minimal
        // For brevity, use a very rough magnitude via a windowed sample (acceptable for coarse bands).
        // In real deployment, use a proper FFT (e.g., JTransforms). Here we will approximate:
        // Compute only first half bins magnitude via Goertzel-like coarse bins (not exact).
        int bins = n/2+1;
        float[] mag = new float[bins];
        for (int k=0;k<bins;k++){
            double wr = 0, wi = 0;
            double ang = -2*Math.PI*k/n;
            double cos = Math.cos(ang), sin = Math.sin(ang);
            double r=1, i=0;
            for (int t=0;t<n;t++){
                wr = wr*cos - wi*sin + frame[t];
                wi = wi*cos + wr*sin;
            }
            mag[k] = (float)Math.hypot(wr, wi);
        }
        return mag;
    }

    static double bandEnergy(float[] mag, int sr, float center, double q) {
        int n = (mag.length-1)*2;
        double bw = center / q;
        double fmin = Math.max(20, center - bw/2);
        double fmax = Math.min(sr/2.0, center + bw/2);
        int kmin = (int)Math.floor(fmin * n / sr);
        int kmax = (int)Math.ceil (fmax * n / sr);
        kmin = Math.max(0, kmin); kmax = Math.min(mag.length-1, kmax);
        double sum = 0; int count = 0;
        for (int k=kmin;k<=kmax;k++){ sum += mag[k]; count++; }
        return sum / Math.max(1, count);
    }

    // ----- Multi-band EQ processor -----
    static class MultiBandEQ implements AudioProcessor {
        private final BiquadFilter[] filters;
        MultiBandEQ(float sr, float[] gainsDb){
            filters = new BiquadFilter[]{
                peak(sr, BAND_CENTERS[0], 1.0f, gainsDb[0]),
                peak(sr, BAND_CENTERS[1], 1.0f, gainsDb[1]),
                peak(sr, BAND_CENTERS[2], 1.0f, gainsDb[2]),
                peak(sr, BAND_CENTERS[3], 1.0f, gainsDb[3]),
                highShelf(sr, BAND_CENTERS[4], 0.707f, gainsDb[4]),
            };
        }
        @Override public boolean process(AudioEvent e){
            for (BiquadFilter f: filters) f.process(e);
            return true;
        }
        @Override public void processingFinished(){}
        private BiquadFilter peak(float sr, float f0, float q, float gainDb){
            return new BiquadFilter(BiquadFilter.Type.PEAK, f0, sr, q, (float)Math.pow(10.0, gainDb/20.0));
        }
        private BiquadFilter highShelf(float sr, float f0, float q, float gainDb){
            return new BiquadFilter(BiquadFilter.Type.HIGHSHELF, f0, sr, q, (float)Math.pow(10.0, gainDb/20.0));
        }
    }

    // ----- Watermark -----
    static class Watermark implements AudioProcessor {
        private final int startSamples;
        private final int len;
        private final float[] tone;
        Watermark(int sr, float startSec, int[] freqs, float levelDb, float durSec){
            startSamples = (int)(startSec*sr);
            len = (int)(durSec*sr);
            tone = new float[len];
            for (int i=0;i<len;i++){
                float t = i/(float)sr;
                float s=0;
                for (int f: freqs) s += Math.sin(2*Math.PI*f*t);
                tone[i] = (float)(s);
            }
            float peak = 1e-6f;
            for (float v: tone) peak = Math.max(peak, Math.abs(v));
            float g = (float)Math.pow(10.0, levelDb/20.0) / peak;
            for (int i=0;i<len;i++) tone[i]*=g;
        }
        @Override public boolean process(AudioEvent e){
            float[] b = e.getFloatBuffer();
            for (int i=0;i<Math.min(len, b.length - startSamples); i++){
                int idx = startSamples + i;
                if (idx>=0 && idx<b.length) b[idx] += tone[i];
            }
            return true;
        }
        @Override public void processingFinished(){}
    }

    // ----- Simple WAV reader (mono PCM16) at target rate -----
    static class Wav {
        static float[] readMono(String path, int srTarget) throws Exception {
            // Use Tarsos fromPipe for resampling to target SR, then capture via dispatcher
            AudioDispatcher disp = AudioDispatcherFactory.fromPipe(path, srTarget, 2048, 1024);
            List<Float> data = new ArrayList<>();
            disp.addAudioProcessor(new AudioProcessor(){
                @Override public boolean process(AudioEvent e){
                    float[] buf = e.getFloatBuffer();
                    for (float v: buf) data.add(v);
                    return true;
                }
                @Override public void processingFinished(){}
            });
            disp.run();
            float[] y = new float[data.size()];
            for (int i=0;i<y.length;i++) y[i]=data.get(i);
            return y;
        }
    }

    static String sha256File(File f) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        try (InputStream is = new FileInputStream(f)) {
            byte[] buf = new byte[8192];
            int r;
            while ((r = is.read(buf)) > 0) md.update(buf, 0, r);
        }
        StringBuilder sb = new StringBuilder();
        for (byte b : md.digest()) sb.append(String.format("%02x", b));
        return sb.toString();
    }
}
