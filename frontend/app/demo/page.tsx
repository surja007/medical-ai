import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BackButton } from '@/components/ui/back-button'
import { Play, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function DemoPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
            <Header />

            <main className="pt-20">
                <section className="py-16 px-4 sm:px-6 lg:px-8">
                    <div className="container mx-auto max-w-4xl">
                        <BackButton href="/">Back to Home</BackButton>
                    </div>
                    <div className="container mx-auto max-w-4xl text-center">
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                            See HealthAI in Action
                        </h1>
                        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                            Watch how our AI-powered platform analyzes symptoms, processes health images,
                            and provides personalized recommendations.
                        </p>
                    </div>
                </section>

                <section className="py-16 px-4 sm:px-6 lg:px-8">
                    <div className="container mx-auto max-w-6xl">
                        <Card className="p-8 mb-12">
                            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-6">
                                <div className="text-center">
                                    <div className="inline-flex items-center justify-center w-20 h-20 bg-health-primary rounded-full mb-4">
                                        <Play className="w-8 h-8 text-white ml-1" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                        Interactive Demo Video
                                    </h3>
                                    <p className="text-gray-600">
                                        Coming Soon - Full platform walkthrough
                                    </p>
                                </div>
                            </div>

                            <div className="text-center">
                                <Button asChild size="lg">
                                    <Link href="/auth/register">
                                        Try It Yourself
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Link>
                                </Button>
                            </div>
                        </Card>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}