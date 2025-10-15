"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    setIsPending(true);
    setSubmitted(true);
    timeoutRef.current = window.setTimeout(() => {
      setIsPending(false);
      setSubmitted(false);
    }, 3000);
  };

  return (
    <Card className="h-full">
      <form onSubmit={handleSubmit} className="flex h-full flex-col">
        <CardHeader className="space-y-2">
          <CardTitle>Let&apos;s collaborate</CardTitle>
          <CardDescription>
            Reach out if you want to co-design environments, integrate PlaygroundRL, or share feedback on the new UI.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="contact-name">Name</Label>
            <Input
              id="contact-name"
              name="name"
              placeholder="Ada Lovelace"
              required
              autoComplete="name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contact-email">Email</Label>
            <Input
              id="contact-email"
              name="email"
              type="email"
              inputMode="email"
              placeholder="you@company.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contact-message">Message</Label>
            <Textarea
              id="contact-message"
              name="message"
              placeholder="Tell us about your project, team, or the features you&apos;d love to see."
              minLength={12}
              rows={5}
              required
            />
          </div>
          {submitted ? (
            <Badge variant="secondary" className="flex w-full items-center justify-center py-2 text-sm">
              Thanks! We&apos;ll get back to you shortly.
            </Badge>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-3 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted-foreground">
            This demo stores messages locally — wire it up to your favourite email or ticketing system.
          </p>
          <Button type="submit" size="lg" disabled={isPending} className="sm:min-w-[160px]">
            {isPending ? "Sending…" : "Send message"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
