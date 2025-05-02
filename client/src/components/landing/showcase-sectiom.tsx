"use client";
import React from "react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";

export function HeroScrollDemo() {
  return (
    <div className="bg-zinc-900 flex flex-col overflow-hidden pb-[500px] pt-[400px] ">
      <ContainerScroll
        titleComponent={
          <>
            <h1 className="text-4xl font-semibold text-zinc-100 dark:text-zinc-900">
              What you get access to when you join?
              <br />
              <span className="text-4xl text-zinc-100 dark:text-zinc-900 md:text-[6rem] font-bold mt-1 leading-none">
                Collabverse
              </span>
            </h1>
          </>
        }
      >
        <img
          src={`https://i.pinimg.com/736x/1b/d1/5b/1bd15bb92b50eeb12175e4ab4f8bcbc8.jpg`}
          alt="hero"
          height={720}
          width={1400}
          className="mx-auto rounded-2xl object-cover h-full object-left-top"
          draggable={false}
        />
      </ContainerScroll>
    </div>
  );
}
