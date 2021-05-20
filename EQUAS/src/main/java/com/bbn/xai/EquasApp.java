package com.bbn.xai;

import com.bbn.xai.config.ApplicationProperties;
import com.bbn.xai.config.DefaultProfileUtil;
import io.github.jhipster.config.JHipsterConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.netflix.zuul.EnableZuulProxy;
import org.springframework.core.env.Environment;

import javax.annotation.PostConstruct;
import java.io.File;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.UnknownHostException;
import java.util.*;

@SpringBootApplication
@EnableConfigurationProperties({ApplicationProperties.class})
@EnableDiscoveryClient
@EnableZuulProxy
public class EquasApp {

    private static final Logger log = LoggerFactory.getLogger(EquasApp.class);

    private final Environment env;

    public EquasApp(Environment env) {
        this.env = env;
    }

    /**
     * Initializes EQUAS.
     * <p>
     * Spring profiles can be configured with a program arguments --spring.profiles.active=your-active-profile
     * <p>
     * You can find more information on how profiles work with JHipster on <a href="https://www.jhipster.tech/profiles/">https://www.jhipster.tech/profiles/</a>.
     */
    @PostConstruct
    public void initApplication() {
        Collection<String> activeProfiles = Arrays.asList(env.getActiveProfiles());
        if (activeProfiles.contains(JHipsterConstants.SPRING_PROFILE_DEVELOPMENT) && activeProfiles.contains(JHipsterConstants.SPRING_PROFILE_PRODUCTION)) {
            log.error("You have misconfigured your application! It should not run " +
                "with both the 'dev' and 'prod' profiles at the same time.");
        }
        if (activeProfiles.contains(JHipsterConstants.SPRING_PROFILE_DEVELOPMENT) && activeProfiles.contains(JHipsterConstants.SPRING_PROFILE_CLOUD)) {
            log.error("You have misconfigured your application! It should not " +
                "run with both the 'dev' and 'cloud' profiles at the same time.");
        }
    }

    /**
     * Main method, used to run the application.
     *
     * @param args the command line arguments
     */
    public static void main(String[] args) throws UnknownHostException {
        SpringApplication app = new SpringApplication(EquasApp.class);
        DefaultProfileUtil.addDefaultProfile(app);
        Environment env = app.run(args).getEnvironment();
        String protocol = "http";
        if (env.getProperty("server.ssl.key-store") != null) {
            protocol = "https";
        }
        String hostAddress = "localhost";
        try {
            hostAddress = InetAddress.getLocalHost().getHostAddress();
        } catch (Exception e) {
            log.warn("The host name could not be determined, using `localhost` as fallback");
        }
        log.info("\n----------------------------------------------------------\n\t" +
                "Application '{}' is running! Access URLs:\n\t" +
                "Local: \t\t{}://localhost:{}\n\t" +
                "External: \t{}://{}:{}\n\t" +
                "Faithful VQA Server: \t{}:{}\n\t" +
                "HieCoAtten VQA Server: \t{}:{}\n\t" +
//                "NLG Server: \t{}:{}\n\t" +
                "Dataset Path: \t{}\n\t" +
                "Profile(s): \t{}\n----------------------------------------------------------",
            env.getProperty("spring.application.name"),
            protocol,
            env.getProperty("server.port"),
            protocol,
            EquasApp.getLocalHostLANAddress(),
            env.getProperty("server.port"),
            env.getProperty("application.faithful-vqa-server.host-address"),
            env.getProperty("application.faithful-vqa-server.port"),
            env.getProperty("application.vqa-server.host-address"),
            env.getProperty("application.vqa-server.port"),
//            env.getProperty("application.nlg-server.host-address"),
//            env.getProperty("application.nlg-server.port"),
            EquasApp.getDatasetCanonicalRootPath(env.getProperty("application.evaluation.dataset-root-path")),
            env.getActiveProfiles());

        String configServerStatus = env.getProperty("configserver.status");
        log.info("\n----------------------------------------------------------\n\t" +
                "Config Server: \t{}\n----------------------------------------------------------",
            configServerStatus == null ? "Not found or not setup for this application" : configServerStatus);
    }

    public static String getDatasetCanonicalRootPath(String datasetRootPath) {
        try {
            return new File(datasetRootPath).getCanonicalFile().toString();
        } catch (Exception ex) {
            return "Error getting dataset-root-path";
        }
    }

    public static String getLocalHostLANAddress() throws UnknownHostException {
        try {
            List<Inet4Address> allCandidates = new ArrayList<Inet4Address>();
            String localLanIp = "";
            // Iterate all NICs (network interface cards)...
            Enumeration<NetworkInterface> nets = NetworkInterface.getNetworkInterfaces();
            for (NetworkInterface netint : Collections.list(nets)) {
                // Iterate all IP addresses assigned to each card...
                List<InetAddress> inetAddresses = Collections.list(netint.getInetAddresses());
                for (InetAddress inetAddress : inetAddresses) {
                    if (inetAddress instanceof Inet4Address) {
                        if (!inetAddress.isLoopbackAddress()) {
                            allCandidates.add((Inet4Address)inetAddress);
                        }
                        if (inetAddress.getHostName().endsWith("bbn.com")) {
                            // Found BBN Corp address.
                            return inetAddress.getHostName();
                        }
                        if (inetAddress.getHostAddress().startsWith("128")) {
                            // Found BBN Corp IP address.
                            return inetAddress.getHostAddress();
                        }
//                    if (inetAddress.getHostAddress().startsWith("192")) {
//                        // Found site local address
//                        localLanIp = inetAddress.getHostAddress();
//                    }
                    }
                }
            }
            if (!localLanIp.isEmpty()) {
                return localLanIp;
            } else {
                return allCandidates.get(0).getHostAddress();
            }
        } catch (Exception e) {
            UnknownHostException unknownHostException = new UnknownHostException("Failed to determine LAN address: " + e);
            unknownHostException.initCause(e);
            throw unknownHostException;
        }
    }

}
