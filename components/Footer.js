import Image from 'next/image';
import GitHub from './svgs/github';
import Twitter from './svgs/twitter';
import Discord from './svgs/discord';
import ExtLink from './ext-link';

export default function Footer() {
    return (
        <footer
            style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '2rem',
                backgroundColor: '#0A2540',
                color: 'white',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    width: '100%',
                    marginBottom: '1rem',
                }}
            >
                {/* Logo and text */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Image src="/od-horizontal-logo.svg" width="168" height="34" alt="Open Dollar Logo" style={{ marginBottom: '1rem' }} />
                    <span style={{ fontSize: '1.25rem', color: '#58A6FF' }}>Leverage your liquid staking tokens with the most flexible stablecoin protocol</span>
                </div>

                {/* LAUNCH APP button */}
                <div style={{ padding: '2rem 0rem 2rem 0rem' }}>
                    <a
                        href="https://app.dev.opendollar.com/"
                        style={{
                            whiteSpace: 'nowrap',
                            width: 'auto',
                            padding: '0.75rem 8rem', fontWeight: 'bold', backgroundColor: '#58A6FF', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer',
                        }}
                    >
                        LAUNCH APP
                    </a>
                </div>
            </div>

            {/* Lower section with links and social icons */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    width: '100%',
                    paddingTop: '1rem',
                }}
            >
                {/* PROJECT, RESOURCES, and SOCIALS Links */}
                <div style={{ display: 'flex', width: '100%', gap: '2rem' }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        marginRight: '2rem',
                    }}
                    >
            <span style={{
                fontSize: '1rem',
                fontWeight: 'bold',
                color: '#58A6FF',
                marginBottom: '0.5rem',
            }}
            >
              PROJECT
            </span>
                        <a href="https://app.dev.opendollar.com/" style={{ color: 'white', textDecoration: 'none', marginBottom: '0.5rem' }}>
                            Join
                            Testnet
                        </a>
                        <a href="https://docs.opendollar.com/" style={{ color: 'white', textDecoration: 'none', marginBottom: '0.5rem' }}>Docs</a>
                        <a href="https://github.com/open-dollar" style={{ color: 'white', textDecoration: 'none', marginBottom: '0.5rem' }}>GitHub</a>
                        <a href="https://tally.so/r/wa26qX" style={{ color: 'white', textDecoration: 'none', marginBottom: '0.5rem' }}>Partner</a>
                    </div>

                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        marginRight: '2rem',
                    }}
                    >
            <span style={{
                fontSize: '1rem',
                fontWeight: 'bold',
                color: '#58A6FF',
                marginBottom: '0.5rem',
            }}
            >
              RESOURCES
            </span>
                        <a
                            href="https://www.opendollar.com/lite-paper"
                            style={{ color: 'white', textDecoration: 'none', marginBottom: '0.5rem' }}
                        >
                            Litepaper
                        </a>
                        <a href="https://mirror.xyz/0x8a81CEeb0a12998616F1aB932cDbc941F0d539E9" style={{ color: 'white', textDecoration: 'none', marginBottom: '0.5rem' }}>Blog</a>
                        <a href="https://www.opendollar.com/privacy" style={{ color: 'white', textDecoration: 'none', marginBottom: '0.5rem' }}>
                            Privacy
                            Policy
                        </a>
                        <a href="https://www.opendollar.com/privacy" style={{ color: 'white', textDecoration: 'none', marginBottom: '0.5rem' }}>
                            Terms of
                            Service
                        </a>
                    </div>

                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',

                    }}
                    >
                        <ExtLink href="https://twitter.com/open_dollar" aria-label="Twitter">
                            <Twitter
                                height={32}
                                style={{
                                    fill: 'white', marginBottom: '0.5rem', marginLeft: '0.5rem', marginRight: '0.5rem',
                                }}
                            />
                        </ExtLink>
                        <ExtLink href="https://www.opendollar.com/discord" aria-label="Discord" style={{ display: 'flex' }}>
                            <Discord height={32} style={{ fill: 'white', margin: '0.5rem' }} />
                        </ExtLink>
                        <ExtLink href="https://github.com/orgs/open-dollar/repositories" aria-label="GitHub">
                            <GitHub height={32} style={{ fill: 'white', margin: '0.5rem' }} />
                        </ExtLink>
                    </div>
                </div>
            </div>
        </footer>
    );
}
