// @ts-nocheck

// You would typically place this in a file like `pages/how-it-works.tsx` in a Next.js project.

import React, { useState, useMemo } from 'react';

// --- TYPE DEFINITION ---
// Define a type for the data structure to ensure type safety.
type LotteryLevel = {
  price: number;
  power: number;
  small: string;
  medium: string;
  big: string;
};

// --- DATA SOURCE ---
// This array holds the discrete levels of power, price, and odds.
const lotteryData: LotteryLevel[] = [
    { price: 0.30, power: 0, small: '1/1024', medium: '1/65536', big: '1/4194304' },
    { price: 0.40, power: 1, small: '1/512', medium: '1/65536', big: '1/4194304' },
    { price: 0.60, power: 2, small: '1/256', medium: '1/65536', big: '1/4194304' },
    { price: 1.00, power: 3, small: '1/128', medium: '1/65536', big: '1/4194304' },
    { price: 1.80, power: 4, small: '1/64', medium: '1/65536', big: '1/4194304' },
    { price: 3.40, power: 5, small: '1/32', medium: '1/65536', big: '1/4194304' },
    { price: 6.60, power: 6, small: '1/16', medium: '1/65536', big: '1/4194304' },
    { price: 13.00, power: 7, small: '1/8', medium: '1/65536', big: '1/4194304' },
    { price: 25.80, power: 8, small: '1/4', medium: '1/65536', big: '1/4194304' },
    { price: 51.40, power: 9, small: '1/2', medium: '1/65536', big: '1/4194304' },
    { price: 102.60, power: 10, small: '1/1', medium: '1/65536', big: '1/4194304' },
    { price: 205.00, power: 11, small: '1/1024', medium: '1/32', big: '1/4194304' },
    { price: 409.80, power: 12, small: '1/1024', medium: '1/16', big: '1/4194304' },
    { price: 819.40, power: 13, small: '1/1024', medium: '1/8', big: '1/4194304' },
    { price: 1638.60, power: 14, small: '1/1024', medium: '1/4', big: '1/4194304' },
    { price: 3277.00, power: 15, small: '1/1024', medium: '1/2', big: '1/4194304' },
    { price: 6553.80, power: 16, small: '1/1024', medium: '1/1', big: '1/4194304' },
    { price: 13107.40, power: 17, small: '1/1024', medium: '1/65536', big: '1/32' },
    { price: 26214.60, power: 18, small: '1/1024', medium: '1/65536', big: '1/16' },
    { price: 52429.00, power: 19, small: '1/1024', medium: '1/65536', big: '1/8' },
    { price: 104857.80, power: 20, small: '1/1024', medium: '1/65536', big: '1/4' },
    { price: 209715.40, power: 21, small: '1/1024', medium: '1/65536', big: '1/2' },
    { price: 419430.60, power: 22, small: '1/1024', medium: '1/65536', big: '1/1' },
];

// --- REUSABLE COMPONENTS ---

const StepCard: React.FC<{ number: number; title: string; children: React.ReactNode }> = ({ number, title, children }) => (
    <div className="flex flex-col items-center">
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-2xl mb-4">{number}</div>
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="mt-2 text-gray-400">{children}</p>
    </div>
);

const TrustFeature: React.FC<{ icon: string; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="flex items-start gap-4">
        <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-gray-800 text-cyan-400 text-2xl">{icon}</div>
        <div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <p className="mt-2 text-gray-400">{children}</p>
        </div>
    </div>
);

const FAQItem: React.FC<{ question: string; children: React.ReactNode }> = ({ question, children }) => (
     <details className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 cursor-pointer">
        <summary className="flex justify-between items-center font-semibold text-white">
            {question}
            <span className="arrow transition-transform duration-200">▶</span>
        </summary>
        <p className="mt-2 text-gray-400">{children}</p>
    </details>
);


// --- MAIN PAGE COMPONENT ---
export default function HowFoomWorksPage() {
    const [sliderIndex, setSliderIndex] = useState(6);

    const currentLevel = useMemo(() => lotteryData[sliderIndex], [sliderIndex]);

    const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSliderIndex(parseInt(event.target.value, 10));
    };

    return (
        <>
            {/* Global styles are embedded directly for self-containment */}
            <style>{`
                /* Global font styles */
                body {
                    font-family: 'Inter', sans-serif;
                }
                /* Custom styles for the range slider */
                input[type=range] {
                    -webkit-appearance: none; appearance: none;
                    width: 100%; cursor: pointer; background: transparent;
                }
                input[type=range]:focus { outline: none; }
                input[type=range]::-webkit-slider-runnable-track {
                    width: 100%; height: 8px; background: #1F2937; border-radius: 5px;
                }
                input[type=range]::-moz-range-track {
                    width: 100%; height: 8px; background: #1F2937; border-radius: 5px;
                }
                input[type=range]::-webkit-slider-thumb {
                    -webkit-appearance: none; appearance: none;
                    margin-top: -8px; height: 24px; width: 24px;
                    background-color: #ffffff; border-radius: 50%;
                    border: 4px solid #F87171; transition: transform 0.2s ease;
                }
                input[type=range]:hover::-webkit-slider-thumb { transform: scale(1.1); }
                input[type=range]::-moz-range-thumb {
                    height: 24px; width: 24px; background-color: #ffffff;
                    border-radius: 50%; border: 4px solid #F87171;
                    transition: transform 0.2s ease;
                }
                input[type=range]:hover::-moz-range-thumb { transform: scale(1.1); }
                details > summary { list-style: none; }
                details > summary::-webkit-details-marker { display: none; }
                details[open] summary .arrow { transform: rotate(90deg); }
            `}</style>

            {/* Main container with dark background and text color applied directly */}
            <div className="antialiased bg-[#0A0A0A] text-gray-200 min-h-screen">
                <div className="max-w-4xl mx-auto px-4 py-12 sm:py-20">
                    <header className="text-center">
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">How Foom Works</h1>
                        <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">Control Your Odds. Win Anonymously. Welcome to the Future of Lottery.</p>
                    </header>

                    <section className="mt-16 sm:mt-24">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-center">
                           <StepCard number={1} title="Choose Your Power">Use the slider to set your ticket price. More power boosts your odds for the biggest prizes.</StepCard>
                           <StepCard number={2} title="Win from 3 Prize Pools">Every ticket automatically plays in three games at once: The Jackpot, Foom Pot, and Loot Box.</StepCard>
                           <StepCard number={3} title="Claim Anonymously">Our ZK-proof tech lets you claim prizes with total privacy. Your identity is never revealed.</StepCard>
                        </div>
                    </section>

                    <section className="mt-16 sm:mt-24 p-6 sm:p-10 bg-gray-900/50 rounded-2xl border border-gray-800">
                        <div className="text-center">
                            <h2 className="text-3xl font-extrabold text-white">You Control The Game</h2>
                            <p className="mt-2 text-gray-400">Use the Power Slider to see how your ticket price directly increases your chances of winning.</p>
                        </div>
                        <div className="mt-10">
                            <input id="powerSlider" type="range" min="0" max={lotteryData.length - 1} value={sliderIndex} onChange={handleSliderChange} className="w-full" />
                            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center text-center sm:text-left gap-4">
                                <div>
                                    <span className="text-sm text-gray-400">TICKET PRICE</span>
                                    <p className="text-2xl font-bold text-white">${currentLevel.price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-400">TICKET POWER</span>
                                    <p className="text-2xl font-bold text-red-400">{currentLevel.power}</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-800/50 p-6 rounded-lg text-center border border-gray-700">
                                <h4 className="font-bold text-white">The Loot Box</h4>
                                <p className="mt-1 text-2xl font-semibold text-cyan-400">~$100+</p>
                                <p className="mt-1 text-sm text-gray-400">Your Odds: <span>1 in {currentLevel.small.split('/')[1]}</span></p>
                            </div>
                            <div className="bg-gray-800/50 p-6 rounded-lg text-center border border-gray-700">
                                <h4 className="font-bold text-white">The Foom Pot</h4>
                                <p className="mt-1 text-2xl font-semibold text-cyan-400">~$65,000+</p>
                                <p className="mt-1 text-sm text-gray-400">Your Odds: <span>1 in {currentLevel.medium.split('/')[1]}</span></p>
                            </div>
                            <div className="bg-gray-800/50 p-6 rounded-lg text-center border border-gray-700">
                                <h4 className="font-bold text-white">The Jackpot</h4>
                                <p className="mt-1 text-2xl font-semibold text-cyan-400">~$4,000,000+</p>
                                <p className="mt-1 text-sm text-gray-400">Your Odds: <span>1 in {currentLevel.big.split('/')[1]}</span></p>
                            </div>
                        </div>
                    </section>

                    <section className="mt-16 sm:mt-24">
                        <div className="text-center">
                            <h2 className="text-3xl font-extrabold text-white">A Fair Game by Design. Verified by Code.</h2>
                        </div>
                        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <TrustFeature icon="🎲">The winning numbers are generated from future, unpredictable blockchain data (`blockhash`). No one, not even the Foom team, can influence the outcome.</TrustFeature>
                            <TrustFeature icon="🛡️">Thanks to Zero-Knowledge proofs, you can claim your winnings without ever revealing your wallet address. Your privacy is absolute.</TrustFeature>
                        </div>
                        <div className="mt-10 text-center text-gray-400">
                            <p>Our entire protocol is <a href="https://github.com/Terrestrials/foomlottery" target="_blank" rel="noopener noreferrer" className="font-semibold text-cyan-400 hover:text-cyan-300 underline">Open Source</a>. We invite you to "Don't trust, verify."</p>
                        </div>
                    </section>

                    <section className="mt-16 sm:mt-24">
                        <div className="text-center">
                            <h2 className="text-3xl font-extrabold text-white">Frequently Asked Questions</h2>
                        </div>
                        <div className="mt-12 max-w-2xl mx-auto space-y-4">
                            <FAQItem question="How is 'Ticket Power' calculated?">Power increases exponentially with price. Doubling your ticket price gives you much more than double the power, significantly boosting your odds for the top prizes. It's designed to reward higher-value tickets.</FAQItem>
                            <FAQItem question="What's the minimum and maximum price for a ticket?">The price is flexible. The slider allows you to choose a value from approximately $0.30 up to over $400,000, depending on your desired power level. The system is designed to accommodate all levels of players.</FAQItem>
                            <FAQItem question="Are the prize amounts fixed?">No, the prize pools grow in real-time as more tickets are purchased. The values you see on the interactive slider are examples of potential prize tiers, and the actual prizes will increase as more people play.</FAQItem>
                            <FAQItem question="How do I check if my ticket won?">After a draw is finalized, you can connect your wallet to the Foom dApp. The system will automatically check your purchased tickets against the winning numbers and notify you if you are eligible to claim a prize.</FAQItem>
                        </div>
                    </section>

                    <section className="mt-16 sm:mt-24 text-center">
                        <h2 className="text-3xl font-extrabold text-white">Ready to Play?</h2>
                        <a href="#" className="mt-6 inline-block bg-red-500 hover:bg-red-600 text-white font-bold text-lg rounded-lg px-8 py-4 transition-transform duration-200 hover:scale-105">
                            Choose Your Power & Get Your Ticket
                        </a>
                    </section>
                </div>
            </div>
        </>
    );
}
