import React, { useEffect, useState } from 'react'
import styles from './Home.module.css'
import logo from '../assets/logo.png'
import { FaUser, FaRegCommentDots } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';
import { FaFacebook } from "react-icons/fa";
import { FaInstagram } from "react-icons/fa";
import { FaLinkedin } from "react-icons/fa";
import { FaTwitter } from 'react-icons/fa';
import { IoCall } from "react-icons/io5";
import { IoLocationSharp } from "react-icons/io5";
import { PiDownloadSimpleBold } from "react-icons/pi";
import { Link } from 'react-router-dom';
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Typewriter } from 'react-simple-typewriter';
import backendApi from '../utils/axiosInstance';
import { toast, ToastContainer } from 'react-toastify';

const slides = [
  {
    image: "./src/assets/TradeWis.jpg",
    title: "Trade with Precision & Confidence",
    desc: "Track your profits, losses, and ROI instantly with real-time analytics. TradeWise gives you clarity to see where your money goes and how it grows. Every trade is guided by data-driven insights for smarter investing. Make informed decisions and maximize your returns effortlessly.",
  },
  {
    image: "./src/assets/Smile.jpg",
    title: "Smart Insights, Smarter Decisions",
    desc: "Leverage AI-powered tools to identify market trends quickly. TradeWise analyzes patterns to help you make informed choices. Gain insights that turn data into actionable strategies. Make every trade count with confidence and precision.",
  },
  {
    image: "./src/assets/Devices.jpg",
    title: "Grow Your Portfolio Effortlessly",
    desc: "Manage and monitor all your investments from one dashboard. Stay ahead of the market with live updates and intelligent analytics. TradeWise helps you plan, invest, and grow systematically. Achieve your financial goals with clarity and ease.",
  },
];

const Home = () => {
    const [current, setcurrent ] = useState(0);

    const [sending, setSending] = useState(false)
    const [contactUsData, setContatUsData] = useState({
        name: '',
        email: '',
        message: ''
    });

    const handleContactUsDataChange = (e) => {
        const { name, value } = e.target;
        setContatUsData({ ...contactUsData, [name]: value });
    };

    const handleContactUs = async (e) => {
        e.preventDefault();
        if(contactUsData.name === '' || contactUsData.email === '' || contactUsData.message === '') 
            return toast.error('All fields are required');
        
        try {
            setSending(true);
            const res = await backendApi.post('/email/contact-us', contactUsData);
            
            toast.success("Message sent successfully");
        } catch (error) {
            toast.error("Message not sent");
        } finally {
            setSending(false);
            setContatUsData({ name: '', email: '', message: '' });
        }
    };

    const nextSlide = () => setcurrent((current + 1) % slides.length);
    const prevSlide = () => setcurrent((current -1 + slides.length) % slides.length);
    
    useEffect(() => {
        const timer = setInterval(() => {
            setcurrent((prev) => (prev + 1)  % slides.length);
        }, 14000);
        return () => clearInterval(timer);
    },[]);

    return (
        <>            
            <div className={styles.home_container}>
                <div className={styles.home_navbar}>
                    <img src={logo} alt="logo"  className={styles.home_navbar_logo}/>
                    <h1 className={styles.home_navbar_title}>TradeWise</h1>
                    <div className={styles.home_navbar_links}>
                        <a href="#">Home</a>
                        <a href="#">About</a>
                        <a href="#">Services</a>
                        <a href="#">Contact</a>
                    </div>

                    <div className={styles.home_navbar_buttons}>
                        <button ><Link to='/signup'>Signup</Link></button>
                        <button ><Link to='/login'>Login</Link></button>
                        <button className="bg-[#BE741E] text-white border-none flex items-center gap-2 px-4 py-2 rounded-lg">
                            <PiDownloadSimpleBold className="text-xl mr-1" />
                            Download App
                        </button>
                    </div>
                </div>

                <div className={styles.home_content}>
                    <div className="relative w-screen h-screen overflow-hidden mt-16">
                        {slides.map((slide, index) => (
                            <motion.div key={index} className={`absolute w-full h-full bg-center bg-cover flex flex-col justify-center items-center px-20 text-white ${index === current ? 'flex' : 'hidden'}`} style={{ backgroundImage: `url(${slide.image})` }} initial={{ opacity: 0 }} animate={{ opacity: index === current ? 1 : 0 }} transition={{ duration: 1 }} >
                                <motion.h1 className="text-5xl font-bold mb-1 " initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} > 
                                    <Typewriter words={[slide.title]} loop={true}
                                    cursor
                                    cursorStyle="|"
                                    typeSpeed={70}
                                    deleteSpeed={50}
                                    delaySpeed={2000}
                                /></motion.h1>
                                <motion.p className="text-center text-lg mb-6 mx-40" initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}> 
                                    <Typewriter
                                        words={[slide.desc]} 
                                        loop={true}
                                        cursor
                                        cursorStyle="_"
                                        typeSpeed={10}
                                        deleteSpeed={20}
                                        delaySpeed={2000}
                                    />
                                </motion.p>
                                <motion.button className="bg-[#BE741E] px-6 py-3 text-sm rounded-full font-semibold text-white shadow-lg hover:bg-[#a4641c] transition-all" whileHover={{ scale: 1.05 }} > Get Started</motion.button>
                            </motion.div>
                        ))}

                        <button onClick={prevSlide} className="absolute left-5 top-1/2 -translate-y-1/2 bg-black/40 p-3 rounded-full hover:bg-black/60 transition">
                            <ChevronLeft size={28} color="#fff" />
                        </button>
                        <button onClick={nextSlide} className="absolute right-5 top-1/2 -translate-y-1/2 bg-black/40 p-3 rounded-full hover:bg-black/60 transition">
                            <ChevronRight size={28} color="#fff" />
                        </button>
                    </div>
                    
                    <div className="flex flex-row justify-between items-center gap-16 p-16 bg-gradient-to-br from-orange-50 to-orange-100 relative overflow-hidden">
                        <div className="flex-1 relative z-10">
                            <h2 className="text-3xl font-bold mb-6 leading-tight text-black">
                                About <span className="text-[#BE741E]">TradeWise</span>
                            </h2>
                            <p className="text-lg text-gray-700 leading-relaxed mb-8 font-normal">
                                TradeWise is your ultimate companion in the world of trading. We combine cutting-edge technology with user-friendly design to provide traders with powerful tools for success. Our platform simplifies complex calculations while maintaining the highest standards of accuracy and security.
                            </p>
                            <div className="flex gap-6 mt-10">
                                <div className="bg-white p-6 rounded-xl shadow-md flex-1 border border-orange-100 transition-transform duration-300 cursor-pointer hover:scale-105">
                                    <h3 className="text-3xl text-[#BE741E] mb-3 font-bold">10k+</h3>
                                    <p className="text-gray-600 text-lg font-medium">Active Users</p>
                                </div>
                                <div className="bg-white p-6 rounded-xl shadow-md flex-1 border border-orange-100 transition-transform duration-300 cursor-pointer hover:scale-105">
                                    <h3 className="text-3xl text-[#BE741E] mb-3 font-bold">99%</h3>
                                    <p className="text-gray-600 text-lg font-medium">Accuracy Rate</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex-1 relative max-w-lg z-10">
                            <div className="absolute -top-5 -right-5 bg-[#BE741E] p-4 rounded-lg shadow-lg z-20">
                                <p className="text-white text-lg font-semibold m-0">Real-time Analytics</p>
                            </div>
                            <img 
                                src="./src/assets/TradeWise.jpg" 
                                alt="TradeWise Demo" 
                                className="w-full h-auto rounded-3xl shadow-xl transform perspective-1000 rotate-y-2 transition-transform duration-300 border-4 border-white"
                            />
                            <div className="absolute -bottom-5 -left-5 bg-white p-5 rounded-xl shadow-lg z-20">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <p className="text-gray-800 text-lg font-semibold m-0">Live Market Data</p>
                                </div>
                            </div>
                        </div>
                    </div>


                    <div className={styles.home_content_how}>
                        <div className="text-center mb-16 relative">
                            <h4 className="text-black text-4xl font-bold mb-3 relative inline-block text-center">
                                Take a look at our <span className="text-[#BE741E]">Worksteps</span>
                            </h4>
                            <p className="text-gray-600 text-lg max-w-4xl mx-auto leading-relaxed">
                                Discover how TradeWise simplifies your trading journey with our intuitive three-step process
                            </p>
                        </div>

                        <div className="flex justify-between gap-10 px-10 relative">
                            <WorkStepCard 
                                number="1"
                                title="Enter Trade Details"
                                description="Input purchase price, selling price, and quantity for any asset with our user-friendly interface."
                            />
                            <WorkStepCard 
                                number="2"
                                title="Calculate Profits"
                                description="Get instant profit/loss, ROI, and fee calculations with our advanced algorithms."
                            />
                            <WorkStepCard 
                                number="3"
                                title="Track & Analyze"
                                description="Save trades to your journal and view performance trends over time with detailed analytics."
                            />
                        </div>
                    </div>

                </div>
      
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 py-16 flex justify-center items-start gap-12 flex-wrap mt-20">
                    <div className="max-w-lg min-w-80 flex-1">
                        <h2 className="text-3xl font-bold text-gray-900 mb-5 leading-tight">
                            What People Think<br />About <span className="text-[#BE741E]">TradeWise</span>
                        </h2>
                        <p className="text-gray-700 text-lg mb-5 leading-relaxed">
                            Users rave about TradeWise's efficiency and reliability. Many have praised the smart trading calculator for significantly reducing their time spent on calculations and making their trading experience smoother. The privacy-first approach is also highly appreciated, ensuring users' data is always secure.
                        </p>
                        <p className="text-gray-700 text-lg leading-relaxed">
                            Additionally, TradeWise has received high marks for its accurate and real-time analytics, helping users make better trading decisions. The platform is also lauded for its user-friendly interface and comprehensive reporting tools.
                        </p>
                    </div>
                    <TestimonialCarousel />
                </div>

                <div className="bg-[#1C1206] text-white py-16 flex flex-col items-center">
                    <button className="bg-none border-2 border-white text-white rounded-full px-10 py-3 text-xl font-semibold mb-8 flex items-center gap-3 cursor-pointer hover:bg-white hover:text-[#1C1206] transition-colors">
                        <FaRegCommentDots size={22} className="text-[#BE741E]" />
                        Contact Us
                    </button>
                    <h2 className="text-center text-3xl font-bold mb-3 tracking-wider">
                        <span className="text-white">Any <span className="text-[#BE741E] relative">Insights</span> ?</span><br />
                        <span className="text-white">Feel Free To <span className="text-[#BE741E]">Contact</span> Us</span>
                    </h2>
                    <p className="text-white text-center text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
                        Discover valuable insights and solutions tailored to your trading needs. Contact us today to learn more about how we can streamline your journey and enhance your experience.
                    </p>
                    <form className="w-full max-w-4xl mx-auto flex flex-col gap-8">
                        <div className="flex gap-8 flex-wrap">
                            <div className="flex-1 min-w-64">
                                <label className="text-[#BE741E] text-xl mb-2 block">Name:</label>
                                <div className="flex items-center bg-white rounded-full px-6 py-4 mt-2 border-2 border-[#BE741E]">
                                    <FaUser size={22} className="text-[#91530A]" />
                                    <input type="text" name="name" placeholder="Enter your name" value={contactUsData.name} onChange={handleContactUsDataChange} className="bg-none border-none outline-none text-black text-xl ml-4 w-full" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-64">
                                <label className="text-[#BE741E] text-xl mb-2 block">Email:</label>
                                <div className="flex items-center bg-white rounded-full px-6 py-4 mt-2 border-2 border-[#BE741E]">
                                    <MdEmail size={22} className="text-[#91530A]" />
                                    <input type="email" name="email" placeholder="Enter your email" value={contactUsData.email} onChange={handleContactUsDataChange} className="bg-none border-none outline-none text-black text-xl ml-4 w-full" />
                                </div>
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="text-[#BE741E] text-xl mb-2 block">Message:</label>
                            <div className="flex items-start bg-white rounded-full px-6 py-4 mt-2 border-2 border-[#BE741E]">
                                <FaRegCommentDots size={22} className="text-[#91530A] mt-1" />
                                <textarea placeholder="Enter your message" name="message" value={contactUsData.message} onChange={handleContactUsDataChange} className="bg-none border-none outline-none text-black text-xl ml-4 w-full min-h-20 resize-vertical" />
                            </div>
                        </div>
                        <div className="flex justify-center mt-3">
                            <button 
                                type="submit" 
                                className="bg-[#BE741E] text-white border-none rounded-full px-12 py-4 text-xl font-bold cursor-pointer shadow-lg hover:bg-[#a4641c] transition-colors"
                                onClick={handleContactUs}
                            >
                                {sending ? 'Sending...' : 'Send'}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="bg-orange-50/80 px-48 py-12">
                    <div className="flex justify-center items-center flex-wrap">
                        <div className="text-center">
                        <h2 className="text-black text-4xl mb-8 font-bold">
                            Does This Sound Like Your{" "}
                        <span className="text-[#BE741E]">Question?</span>
                        </h2>
                        <p className="text-gray-700 text-lg mb-12 leading-relaxed">
                            Find answers to commonly asked questions about our products and
                            services here. Can't find what you're looking for? Reach out for
                            personalized help.
                        </p>

                        <FAQList />
                        </div>
                    </div>
                </div>

                <div className="bg-[#91530A] text-white py-16 relative overflow-hidden">
                    <div className="flex items-center justify-center gap-16 flex-wrap">
                        
                        
                        <div className="max-w-lg min-w-80">
                            <h2 className="text-3xl font-bold text-white mb-5">
                                Download Now and begin your journey to better Trading
                            </h2>
                            <p className="text-xl text-orange-100 mb-8 font-normal">
                                Enhance your daily trading experience with TradeWise. Say goodbye to confusion and hello to seamless, smart trading decisions.
                            </p>
                            <div className="flex gap-6 flex-wrap">
                                <a href="#" className="inline-block bg-white rounded-2xl px-7 py-3 text-[#91530A] font-bold text-xl shadow-lg hover:bg-gray-100 transition-colors">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Get it on Google Play" className="h-8 align-middle" />
                                </a>
                                <a href="#" className="inline-block bg-white rounded-2xl px-7 py-3 text-[#91530A] font-bold text-xl shadow-lg hover:bg-gray-100 transition-colors">
                                    <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="Download on the App Store" className="h-8 align-middle" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
           
                <footer className="bg-gradient-to-br from-gray-800 to-gray-900 text-white py-14 font-sans shadow-lg w-full">
                <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-start gap-10 px-8 pb-8 border-b border-gray-700">

                        
                        <div className="min-w-56 flex-1">
                            <h3 className="text-[#BE741E] font-bold text-2xl mb-5">About Us</h3>
                            <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                                TradeWise delivers the finest trading experience right to your screen. We pride ourselves on accuracy, privacy, and exceptional service.
                            </p>
                            <div className="flex gap-4 mt-3">
                                <a href="#" className="text-white text-2xl hover:text-[#BE741E] transition-colors"><FaFacebook /></a>
                                <a href="#" className="text-white text-2xl hover:text-[#BE741E] transition-colors"><FaInstagram /></a>
                                <a href="#" className="text-white text-2xl hover:text-[#BE741E] transition-colors"><FaTwitter /></a>
                                <a href="#" className="text-white text-2xl hover:text-[#BE741E] transition-colors"><FaLinkedin /></a>
                            </div>
                        </div>

                        
                        <div className="min-w-48 flex-1">
                            <h3 className="text-[#BE741E] font-bold text-2xl mb-5">Quick Links</h3>
                            <ul className="list-none p-0 text-gray-300 text-lg leading-loose">
                                <li><a href="#" className="text-white no-underline hover:text-[#BE741E] transition-colors">Home</a></li>
                                <li><a href="#" className="text-white no-underline hover:text-[#BE741E] transition-colors">About</a></li>
                                <li><a href="#" className="text-white no-underline hover:text-[#BE741E] transition-colors">Services</a></li>
                                <li><a href="#" className="text-white no-underline hover:text-[#BE741E] transition-colors">Contact</a></li>
                            </ul>
                        </div>


                        
                        <div className="min-w-56 flex-1">
                            <h3 className="text-[#BE741E] font-bold text-2xl mb-5">Contact Info</h3>
                            <div className="text-gray-300 text-lg mb-3 flex items-center gap-3">
                                <IoCall  className="text-[#BE741E]" /> +250 785 805 869
                            </div>
                            <div className="text-gray-300 text-lg mb-6 flex items-center gap-3 mt-5">
                                <MdEmail  className="text-[#BE741E]" /> support@tradewise.com
                            </div>
                            <div className="text-gray-300 text-lg flex items-center gap-3 mt-5">
                                <IoLocationSharp  className="text-[#BE741E]" />Kigali, Rwanda
                            </div>
                            
                        </div>
                        

                        <div className="min-w-56 flex-1">
                            <h3 className="text-[#BE741E] font-bold text-2xl mb-5">Newsletter</h3>
                            <p className="text-gray-300 text-lg mb-5">
                                Subscribe to our newsletter for updates, special offers, and exclusive deals.
                            </p>
                            <form className="flex flex-col gap-3">
                                <input type="email" placeholder="Enter your email" className="bg-gray-800 border border-gray-600 rounded px-3 py-3 text-white text-lg mb-2" />
                                <button className="bg-[#BE741E] text-gray-800 border-none rounded px-0 py-3 font-bold text-xl cursor-pointer hover:bg-[#a4641c] transition-colors">Subscribe</button>
                            </form>
                        </div>
                    </div>
                    <div className="text-center text-gray-500 mt-7 text-lg tracking-wide">
                        &copy; {new Date().getFullYear()} <span className="text-[#BE741E] font-semibold">TradeWise</span>. All rights reserved </div>
                </footer>
            </div>
        </>
    )
}

const FAQList = () => {
    const faqs = [
        {
            question: 'What is the Smart Calculator for Modern Traders',
            answer: 'TradeWise is a smart trading calculator and portfolio tracker. It helps you calculate profits, losses, and ROI for your trades, and keeps all your trading activity organized in one place.'
        },
        {
            question: 'How do I use the app to track my profits?',
            answer: 'Our calculator uses precise formulas and up-to-date market data to ensure your trading calculations are as accurate as possible.'
        },
        {
            question: 'Is the app free to use?',
            answer: 'TradeWise supports multiple asset types, including stocks and crypto. You can track and analyze different types of trades in one unified dashboard.'
        },
        {
            question: 'What asset types does the app support?',
            answer: 'You can view your trading performance over time, including during market events or high-volatility periods, with our analytics and reporting tools.'
        },
        {
            question: 'How does the TradeWise protect my personal data?',
            answer: 'Your data is stored securely and is never shared. Only you have access to your trading records, and we use strong encryption to protect your information.'
        }
    ];
    const [openIndex, setOpenIndex] = React.useState(null);
    return (
        <div className="flex flex-col gap-7">
            {faqs.map((faq, idx) => (
                <div key={idx} className="bg-white rounded-2xl shadow-lg p-7 cursor-pointer transition-shadow hover:shadow-xl" onClick={() => setOpenIndex(openIndex === idx ? null : idx)}>
                    <div className="flex items-center justify-between">
                        <span className="text-xl font-medium text-gray-900">{faq.question}</span>
                        <span className="ml-5 transition-transform duration-200">
                            {openIndex === idx ? (
                                
                                <svg width="28" height="28" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="18" cy="18" r="17" stroke="#91530A" strokeWidth="3" fill="none" />
                                    <rect x="10" y="17" width="16" height="2" rx="1" fill="#91530A" />
                                </svg>
                            ) : (
                                
                                <svg width="28" height="28" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="18" cy="18" r="17" stroke="#91530A" strokeWidth="3" fill="none" />
                                    <rect x="10" y="17" width="16" height="2" rx="1" fill="#91530A" />
                                    <rect x="17" y="10" width="2" height="16" rx="1" fill="#91530A" />
                                </svg>
                            )}
                        </span>
                    </div>
                    {openIndex === idx && (
                        <div className="mt-5 text-gray-700 text-lg leading-relaxed transition-all duration-200">
                            {faq.answer}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

const testimonials = [
    {
        name: 'Alex M.',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        rating: 5,
        review: "My family uses TradeWise to track our portfolio and ensure our investments are on the right path. It's a fantastic tool for both beginners and experienced traders.",
        date: 'June 13, 2024'
    },
    {
        name: 'Sarah K.',
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        rating: 3,
        review: "TradeWise's analytics are so clear and easy to use. I love how quickly I can see my profit and loss for every trade.",
        date: 'June 10, 2024'
    },
    {
        name: 'John D.',
        avatar: 'https://randomuser.me/api/portraits/men/65.jpg',
        rating: 4,
        review: "The privacy features are top-notch. I feel safe knowing my trading data is secure and only accessible by me.",
        date: 'June 7, 2024'
    }
];

function TestimonialCarousel() {
    const [index, setIndex] = React.useState(0);
    const [isTransitioning, setIsTransitioning] = React.useState(false);

    React.useEffect(() => {
        const timer = setInterval(() => {
            setIsTransitioning(true);
            setTimeout(() => {
                setIndex(prev => (prev + 1) % testimonials.length);
                setIsTransitioning(false);
            }, 300);
        }, 7000);
        return () => clearInterval(timer);
    }, []);

    const goPrev = (e) => {
        e.stopPropagation();
        setIsTransitioning(true);
        setTimeout(() => {
            setIndex(prev => (prev - 1 + testimonials.length) % testimonials.length);
            setIsTransitioning(false);
        }, 300);
    };

    const goNext = (e) => {
        e.stopPropagation();
        setIsTransitioning(true);
        setTimeout(() => {
            setIndex(prev => (prev + 1) % testimonials.length);
            setIsTransitioning(false);
        }, 300);
    };
    
    return (
        <div className="relative min-w-96 max-w-96 flex-1 flex justify-center">
            
            <button onClick={goPrev} className="absolute left-[-38px] top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer text-3xl text-[#BE741E] z-20 hover:text-[#a4641c] transition-colors">&#8592;</button>
            

            <div className={`bg-white rounded-2xl shadow-2xl p-10 min-w-80 max-w-96 flex flex-col items-center border-2 border-orange-100 transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                <img src={testimonials[index].avatar} alt="User Avatar" className="w-18 h-18 rounded-full object-cover border-3 border-[#91530A] mb-3" />
                <div className="font-bold text-2xl text-[#BE741E] mb-2">{testimonials[index].name}</div>
                <div className="text-yellow-400 text-2xl mb-3">
                    {Array(testimonials[index].rating).fill().map((_, i) => <span key={i}>&#9733;</span>)}
                </div>
                <div className="text-gray-700 text-lg text-center mb-5 leading-relaxed">
                    {testimonials[index].review}
                </div>
                <div className="text-gray-500 text-lg mt-2">{testimonials[index].date}</div>
            </div>
            
            

            <button onClick={goNext} className="absolute right-[-38px] top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer text-3xl text-[#BE741E] z-20 hover:text-[#a4641c] transition-colors">&#8594;</button>
            
            
            <div className="absolute bottom-[-32px] left-1/2 -translate-x-1/2 flex gap-2">
                {testimonials.map((_, i) => (
                    <span key={i} className={`w-${i === index ? '4' : '3'} h-${i === index ? '4' : '3'} rounded-full bg-[#BE741E] inline-block transition-all duration-300`}></span>
                ))}
            </div>
        </div>
    );
}

const WorkStepCard = ({ number, title, description }) => {
    const [isHovered, setIsHovered] = React.useState(false);

    return (
        <div 
            className={`bg-white rounded-2xl p-10 shadow-lg flex-1 relative z-10 transition-all duration-300 cursor-pointer border border-orange-100 hover:shadow-2xl ${isHovered ? 'transform -translate-y-3 shadow-2xl' : ''} flex flex-col items-center`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            
            {number !== "3" && (
                <div className="absolute top-1/2 right-[-40px] w-10 h-0.5 bg-gradient-to-r from-[#BE741E] to-orange-300 z-20 -translate-y-1/2 flex items-center">
                    <div className="absolute right-0 w-2 h-2 rounded-full bg-[#BE741E] animate-pulse"></div>
                </div>
            )}

            
            <div className={`w-18 h-18 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold shadow-lg transition-all duration-300 relative z-30 ${isHovered ? 'bg-gradient-to-br from-[#BE741E] to-[#91530A] shadow-xl scale-110' : 'bg-[#BE741E]'}`}>
                {number}
                {isHovered && (
                    <div className="absolute -top-1 -left-1 -right-1 -bottom-1 border-2 border-[#BE741E] rounded-full animate-ping"></div>
                )}
            </div>

            
            <h3 className={`text-gray-800 text-2xl font-bold mb-4 text-center transition-all duration-300 ${isHovered ? 'scale-105' : ''}`}>{title}</h3>
            <p className={`text-gray-600 text-lg leading-relaxed text-center transition-all duration-300 ${isHovered ? 'opacity-100' : 'opacity-80'}`}>{description}</p>

            
            {isHovered && (
                <div className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-br from-orange-50/20 to-orange-100/5 rounded-2xl z-[-1]"></div>
            )}
        </div>
    );
};

export default Home;




