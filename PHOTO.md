# Adding the profile photo

`Hero` already supports a `photoSrc` prop (see `components/Hero.tsx`) that
renders a framed, corner-bracketed photo panel next to the name/tagline. It
isn't wired up yet because the image wasn't available as a file to commit.

To finish it:

1. Save the photo as `public/photo.jpg` (a roughly square crop works best —
   the frame is a fixed 168×168 box, `object-fit: cover`).
2. In `app/page.tsx`, pass it to `Hero`:
   ```tsx
   <Hero
     ...
     photoSrc="/photo.jpg"
   />
   ```
3. Delete this file once it's done.
